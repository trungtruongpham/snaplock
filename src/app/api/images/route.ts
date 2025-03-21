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

// Define interface for image tag relation
interface ImageTagRelation {
  image_id: string;
  tag_id: string;
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

    // Base query
    let query = supabase
      .from("images")
      .select("*", { count: "exact", head: true });

    // Apply tag filters if provided
    if (tags.length > 0) {
      // Get tag IDs for all tags
      const { data: tagData, error: tagError } = await supabase
        .from("tags")
        .select("id, name")
        .in("name", tags);

      if (tagError || !tagData || tagData.length === 0) {
        console.log("Tags not found:", tags);
        return NextResponse.json({ images: [], hasMore: false });
      }

      const tagIds = tagData.map((tag) => tag.id);
      console.log("Found tag IDs:", tagIds);

      if (tags.length === 1) {
        // Simple case: just one tag
        const { data: imageIds, error: imageIdsError } = await supabase
          .from("images_tags")
          .select("image_id")
          .eq("tag_id", tagIds[0]);

        if (imageIdsError || !imageIds || imageIds.length === 0) {
          console.log("No images found with tag:", tags[0]);
          return NextResponse.json({ images: [], hasMore: false });
        }

        // Apply the filter to our query
        query = query.in(
          "id",
          imageIds.map((item) => item.image_id)
        );
      } else {
        // Multiple tags case: Find images that have ALL of the specified tags
        // We'll use a more complex query based on intersections

        // Get all image-tag relationships for these tags
        const { data: imageTags, error: imageTagsError } = await supabase
          .from("images_tags")
          .select("image_id, tag_id")
          .in("tag_id", tagIds);

        if (imageTagsError || !imageTags || imageTags.length === 0) {
          console.log("No images found with the specified tags");
          return NextResponse.json({ images: [], hasMore: false });
        }

        // Group by image_id and count tag matches
        const imageCounts: Record<string, number> = {};

        imageTags.forEach((item) => {
          if (!imageCounts[item.image_id]) {
            imageCounts[item.image_id] = 0;
          }
          imageCounts[item.image_id]++;
        });

        // Find images that have all the tags (count matches number of tags)
        const matchingImageIds = Object.entries(imageCounts)
          .filter(([, count]) => count >= tags.length)
          .map(([imageId]) => imageId);

        if (matchingImageIds.length === 0) {
          console.log("No images found with all the specified tags");
          return NextResponse.json({ images: [], hasMore: false });
        }

        // Apply the filter to our query
        query = query.in("id", matchingImageIds);
      }
    }

    // Add ordering
    query = query.order("created_at", { ascending: false });

    // Get count for pagination
    const { count, error: countError } = await query;

    if (countError) {
      throw countError;
    }

    console.log("Total matching images:", count);

    // Now get the actual images with pagination
    let imagesQuery = supabase
      .from("images")
      .select("*")
      .order("created_at", { ascending: false });

    // Apply the same tag filters if needed
    if (tags.length > 0) {
      // First get tag IDs again
      const { data: tagData } = await supabase
        .from("tags")
        .select("id, slug")
        .in("slug", tags);

      if (tagData && tagData.length > 0) {
        const tagIds = tagData.map((tag) => tag.id);

        if (tags.length === 1) {
          // Simple case for one tag
          const { data: imageIds } = await supabase
            .from("images_tags")
            .select("image_id")
            .eq("tag_id", tagIds[0]);

          if (imageIds && imageIds.length > 0) {
            imagesQuery = imagesQuery.in(
              "id",
              imageIds.map((item) => item.image_id)
            );
          }
        } else {
          // Multiple tags case
          const { data: imageTags } = await supabase
            .from("images_tags")
            .select("image_id, tag_id")
            .in("tag_id", tagIds);

          if (imageTags && imageTags.length > 0) {
            // Group by image_id and count tag matches
            const imageCounts: Record<string, number> = {};

            imageTags.forEach((item) => {
              if (!imageCounts[item.image_id]) {
                imageCounts[item.image_id] = 0;
              }
              imageCounts[item.image_id]++;
            });

            // Find images that have all the tags
            const matchingImageIds = Object.entries(imageCounts)
              .filter(([, count]) => count >= tags.length)
              .map(([imageId]) => imageId);

            if (matchingImageIds.length > 0) {
              imagesQuery = imagesQuery.in("id", matchingImageIds);
            }
          }
        }
      }
    }

    // Apply pagination
    const { data: imagesData, error: imagesError } = await imagesQuery.range(
      from,
      to
    );

    if (imagesError) {
      throw imagesError;
    }

    if (!imagesData || imagesData.length === 0) {
      console.log("No images found matching criteria");
      return NextResponse.json({ images: [], hasMore: false });
    }

    // Fetch tags for these images in a separate query
    const fetchedImageIds = imagesData.map((img) => img.id);

    // Get the image-tag relationships for these images
    const { data: imageTagRelations, error: imageTagsError } = await supabase
      .from("images_tags")
      .select("image_id, tag_id")
      .in("image_id", fetchedImageIds);

    if (imageTagsError) {
      throw imageTagsError;
    }

    // Get all the tag IDs
    const tagIds = [
      ...new Set((imageTagRelations || []).map((it) => it.tag_id)),
    ];

    // Fetch all tags if there are any
    let tagsData: Tag[] = [];

    if (tagIds.length > 0) {
      const { data: fetchedTags, error: tagsError } = await supabase
        .from("tags")
        .select("*")
        .in("id", tagIds);

      if (tagsError) {
        throw tagsError;
      }

      tagsData = fetchedTags || [];
    }

    // Now combine everything
    const imagesWithTags = imagesData.map((image) => {
      // Find all tag IDs for this image
      const thisImageTagIds = (imageTagRelations || [])
        .filter((it: ImageTagRelation) => it.image_id === image.id)
        .map((it: ImageTagRelation) => it.tag_id);

      // Find the tag objects for these IDs
      const thisImageTags = tagsData.filter((tag: Tag) =>
        thisImageTagIds.includes(tag.id)
      );

      return {
        ...image,
        tags: thisImageTags,
      };
    });

    const hasMore = count ? from + pageSize < count : false;

    return NextResponse.json({
      images: imagesWithTags,
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
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;

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
