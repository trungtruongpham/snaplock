"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateProfile } from "@/app/profile/actions";

const profileFormSchema = z.object({
  username: z
    .string()
    .min(3, {
      message: "Username must be at least 3 characters.",
    })
    .max(30, {
      message: "Username must not be longer than 30 characters.",
    })
    .optional(),
  full_name: z
    .string()
    .max(60, {
      message: "Full name must not be longer than 60 characters.",
    })
    .optional(),
  display_name: z
    .string()
    .min(2, {
      message: "Display name must be at least 2 characters.",
    })
    .max(50, {
      message: "Display name must not be longer than 50 characters.",
    })
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Function to resize image before upload
async function resizeImage(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(img.src);

      let width = img.width;
      let height = img.height;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height));
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Fill with white background for transparent images
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas to Blob conversion failed"));
            return;
          }

          // Create a new file from the blob with a .jpg extension
          const fileName = file.name.split(".")[0] || "avatar";
          const resizedFile = new File([blob], `${fileName}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          resolve(resizedFile);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Error loading image"));
    };
  });
}

export function ProfileForm({ user }: { user: User }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Get user metadata
  const userMetadata = user.user_metadata || {};

  // Default values from user metadata
  const defaultValues: Partial<ProfileFormValues> = {
    username: userMetadata.username || "",
    full_name: userMetadata.full_name || "",
    display_name: userMetadata.display_name || "",
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
  });

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);
    try {
      const result = await updateProfile(data);

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
        return;
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update profile. ${error}`,
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Handle avatar upload
  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description:
          "Avatar image must be less than 5MB. Please choose a smaller image or resize it.",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image file.",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Resize the image before uploading
      let fileToUpload = file;

      // Only resize if it's not a GIF (to preserve animation)
      if (file.type !== "image/gif") {
        try {
          fileToUpload = await resizeImage(file, 400, 400, 0.85);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_) {
          // Continue with original file if resize fails
        }
      }

      const formData = new FormData();
      formData.append("avatar", fileToUpload);

      const result = await updateProfile(formData);

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
        return;
      }

      toast({
        title: "Avatar updated",
        description: "Your avatar has been updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update avatar. ${error}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border-none sm:border shadow-none sm:shadow">
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>
          Update your profile information and avatar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex flex-col items-center space-y-3">
            <Avatar className="h-24 w-24 border-2 border-muted">
              <AvatarImage
                src={
                  user?.user_metadata?.avatar_url ||
                  user?.app_metadata?.avatar_url
                }
                alt={userMetadata.full_name || user.email || ""}
              />
              <AvatarFallback className="text-2xl">
                {user.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="outline"
              size="sm"
              className="relative"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Avatar
                </>
              )}
              <Input
                type="file"
                accept="image/*"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={handleAvatarUpload}
                disabled={isUploading}
              />
            </Button>
          </div>

          <div className="w-full mt-6 sm:mt-0">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your display name" {...field} />
                      </FormControl>
                      <FormDescription>
                        This is how your name will appear publicly.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update profile"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
