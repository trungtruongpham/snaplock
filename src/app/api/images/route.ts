import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Tag } from "@/types/database";
import type { UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
});

// Define type for the response from our joined query
interface ImageWithRelations {
  id: string;
  title: string;
  description?: string;
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  likes_count?: number;
  images_tags: Array<{
    tag_id: string;
    tags: Tag;
  }>;
  image_likes: Array<{
    id: string;
    user_id: string;
  }>;
}

// Define type for the matchingImages response
interface ImageMatch {
  image_id: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Get all instances of tag parameter
    const tags = searchParams.getAll("tag").filter(Boolean);

    console.log(tags);

    console.log(
      "API received search params:",
      Object.fromEntries(searchParams.entries())
    );
    console.log("API processing tags:", tags);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "12", 10);

    // Calculate pagination range
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    console.log("Page:", page, "PageSize:", pageSize);
    console.log("Range - From:", from, "To:", to);

    const supabase = await createClient();

    // Get user ID from session (if authenticated) to check likes
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    // Build the query with all the related data in a single fetch
    let imagesQuery = supabase
      .from("images")
      .select(
        `
        *,
        images_tags!inner (
          tag_id,
          tags:tags (*)
        ),
        image_likes (
          id,
          user_id
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    // Apply any tag filters if necessary
    if (tags.length > 0) {
      // Get tag IDs for the selected tags
      const { data: tagData } = await supabase
        .from("tags")
        .select("id, name")
        .in("name", tags);

      if (tagData && tagData.length > 0) {
        const tagIds = tagData.map((tag) => tag.id);

        if (tags.length === 1) {
          // For a single tag, use the foreign key relationship directly
          imagesQuery = imagesQuery.eq("images_tags.tag_id", tagIds[0]);
        } else {
          // For multiple tags, we need a more complex approach
          // First get images with ALL the tags
          const { data: matchingImages } = await supabase.rpc(
            "get_images_with_all_tags",
            { tag_ids: tagIds }
          );

          if (!matchingImages || matchingImages.length === 0) {
            return NextResponse.json({
              images: [],
              hasMore: false,
              total: 0,
            });
          }

          // Then filter our main query to only include these images
          const imageIds = matchingImages.map(
            (img: ImageMatch) => img.image_id
          );
          imagesQuery = imagesQuery.in("id", imageIds);
        }
      } else {
        // No matching tags found
        return NextResponse.json({
          images: [],
          hasMore: false,
          total: 0,
        });
      }
    }

    // Apply pagination
    const {
      data: imagesData,
      error: imagesError,
      count,
    } = await imagesQuery.range(from, to);

    if (imagesError) {
      console.error("Error fetching images:", imagesError);
      throw imagesError;
    }

    if (!imagesData || imagesData.length === 0) {
      return NextResponse.json({
        images: [],
        hasMore: false,
        total: count || 0,
      });
    }

    // Process the results to organize likes and tags
    const processedImages = imagesData.map((img: ImageWithRelations) => {
      // Extract tags from the joined data
      const tags = img.images_tags
        ? Array.from(
            new Set(img.images_tags.map((it: { tags: Tag }) => it.tags))
          )
        : [];

      // Check if the current user has liked this image
      const isLikedByUser = userId
        ? img.image_likes.some(
            (like: { user_id: string }) => like.user_id === userId
          )
        : false;

      // Count total likes
      const likesCount = img.image_likes ? img.image_likes.length : 0;

      // Create the final image object
      return {
        ...img,
        tags,
        is_liked_by_user: isLikedByUser,
        likes_count: likesCount,
        // Remove the raw relationships from the final object
        images_tags: undefined,
        image_likes: undefined,
      };
    });

    const hasMore = count ? from + pageSize < count : false;

    return NextResponse.json({
      images: processedImages,
      hasMore,
      total: count,
    });
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const formData = await request.formData();

    // Extract form data
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const tags = JSON.parse(formData.get("tags") as string) as string[];

    if (!file || !title) {
      return NextResponse.json(
        { error: "File and title are required" },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const base64String = buffer.toString("base64");
    const uploadResult = await new Promise<UploadApiResponse>(
      (resolve, reject) => {
        cloudinary.uploader.upload(
          `data:${file.type};base64,${base64String}`,
          {
            folder: "wallpapers",
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else if (result) resolve(result);
            else reject(new Error("No result returned from Cloudinary"));
          }
        );
      }
    );

    // Get user ID from session (if authenticated)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    // Save image metadata to Supabase
    const { data: imageData, error: imageError } = await supabase
      .from("images")
      .insert({
        title,
        description,
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        user_id: userId,
        likes_count: 0, // Initialize likes count
      })
      .select()
      .single();

    if (imageError) {
      throw new Error(`Error saving image metadata: ${imageError.message}`);
    }

    // Process tags
    if (tags && tags.length > 0) {
      // First, ensure all tags exist in the database
      for (const tagName of tags) {
        const slug = tagName.toLowerCase().replace(/\s+/g, "-");

        // Check if tag already exists
        const { data: existingTag } = await supabase
          .from("tags")
          .select("id")
          .eq("slug", slug)
          .single();

        if (!existingTag) {
          // Create new tag
          await supabase.from("tags").insert({
            name: tagName,
            slug,
          });
        }
      }

      // Get all tag IDs
      const { data: tagData } = await supabase
        .from("tags")
        .select("id, slug")
        .in(
          "slug",
          tags.map((tag) => tag.toLowerCase().replace(/\s+/g, "-"))
        );

      // Create image-tag relations
      if (tagData && tagData.length > 0) {
        const imageTagRelations = tagData.map((tag) => ({
          image_id: imageData.id,
          tag_id: tag.id,
        }));

        await supabase.from("image_tags").insert(imageTagRelations);
      }
    }

    revalidatePath("/");

    return NextResponse.json({
      success: true,
      image: imageData,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
