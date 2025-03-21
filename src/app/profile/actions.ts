"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Define the profile schema
const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must not be longer than 30 characters")
    .optional(),
  full_name: z
    .string()
    .max(60, "Full name must not be longer than 60 characters")
    .optional(),
  display_name: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must not be longer than 50 characters")
    .optional(),
});

type ProfileData = z.infer<typeof profileSchema>;

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Update user profile information
 */
export async function updateProfile(formData: FormData | ProfileData) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: userError?.message || "User not authenticated" };
    }

    // Handle different types of updates
    if (formData instanceof FormData) {
      // Handle avatar upload
      const avatarFile = formData.get("avatar") as File;

      if (!avatarFile) {
        return { error: "No avatar file provided" };
      }

      // Check file size
      if (avatarFile.size > MAX_FILE_SIZE) {
        return {
          error:
            "File size exceeds the maximum limit of 5MB. Please upload a smaller image.",
        };
      }

      // Check file type
      if (!avatarFile.type.startsWith("image/")) {
        return { error: "Invalid file type. Please upload an image file." };
      }

      try {
        // Upload to Supabase Storage with user ID in path
        // The path format ensures users can only upload to their own folder
        // This works with the RLS policy: (storage.foldername(name))[1] = auth.uid()::text
        const fileName = `${user.id}/${Date.now()}-avatar.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);

          // Provide helpful error messages based on error type
          if ((uploadError as { statusCode?: string }).statusCode === "403") {
            return {
              error:
                "Permission denied when uploading avatar. Please make sure the 'avatars' bucket exists and has the correct permissions.",
            };
          }

          if ((uploadError as { statusCode?: string }).statusCode === "404") {
            return {
              error:
                "Storage bucket 'avatars' not found. Please create it in the Supabase dashboard.",
            };
          }

          return { error: `Failed to upload avatar: ${uploadError.message}` };
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        const avatarUrl = publicUrlData.publicUrl;

        // Update user metadata with avatar URL
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          },
        });

        if (updateError) {
          return { error: `Failed to update avatar: ${updateError.message}` };
        }

        revalidatePath("/profile");
        revalidatePath("/", "layout");
        return { success: true };
      } catch (uploadError) {
        console.error("Avatar upload error:", uploadError);
        return {
          error:
            "An error occurred while uploading the avatar. Please try again with a smaller image.",
        };
      }
    } else {
      // Handle profile data update
      const result = profileSchema.safeParse(formData);

      if (!result.success) {
        return { error: "Invalid profile data" };
      }

      const userData = result.data;

      // Update display name if provided
      if (userData.display_name) {
        // First update the user's display name in auth.users
        const { error: displayNameError } = await supabase.auth.updateUser({
          data: {
            display_name: userData.display_name,
          },
        });

        if (displayNameError) {
          return {
            error: `Failed to update display name: ${displayNameError.message}`,
          };
        }
      }

      // Update other user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...userData,
          updated_at: new Date().toISOString(),
        },
      });

      if (updateError) {
        return { error: `Failed to update profile: ${updateError.message}` };
      }

      revalidatePath("/profile");
      revalidatePath("/", "layout");
      return { success: true };
    }
  } catch (error) {
    console.error("Profile update error:", error);
    return { error: `An unexpected error occurred: ${error}` };
  }
}
