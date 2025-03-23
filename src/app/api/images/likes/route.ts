import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { imageId } = await request.json();

    // Validate input
    if (!imageId) {
      return NextResponse.json(
        { error: "Image ID is required" },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Use a single query to check if the like exists
    const { data: existingLike, error: queryError } = await supabase
      .from("image_likes")
      .select("id")
      .eq("user_id", userId)
      .eq("image_id", imageId)
      .maybeSingle();

    if (queryError) {
      throw new Error(`Error checking like status: ${queryError.message}`);
    }

    let isLiked = false;

    // Use a transaction to ensure data consistency
    const { error: txError } = await supabase.rpc("toggle_image_like", {
      p_user_id: userId,
      p_image_id: imageId,
    });

    if (txError) {
      throw new Error(`Error toggling like status: ${txError.message}`);
    }

    // Determine the new status based on the previous state
    isLiked = !existingLike;

    revalidatePath("/");
    return NextResponse.json({
      success: true,
      action: isLiked ? "liked" : "unliked",
      isLiked,
    });
  } catch (error) {
    console.error("Error processing like:", error);
    return NextResponse.json(
      { error: "Failed to process like" },
      { status: 500 }
    );
  }
}

// GET method to check if a user has liked an image and get like count
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("imageId");

    if (!imageId) {
      return NextResponse.json(
        { error: "Image ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get user authentication status
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    // Fetch the image with its like count and check if user has liked it
    // Uses a direct count query for performance
    const { data, error } = await supabase
      .from("images")
      .select(
        `
        id, 
        likes_count,
        user_like:image_likes!image_likes_user_id_fkey(id)
      `
      )
      .eq("id", imageId)
      .eq(
        "image_likes.user_id",
        userId || "00000000-0000-0000-0000-000000000000"
      )
      .single();

    if (error) {
      throw error;
    }

    // Check if user has liked the image
    const isLikedByUser = userId ? data?.user_like?.length > 0 : false;

    return NextResponse.json({
      likes_count: data?.likes_count || 0,
      is_liked_by_user: isLikedByUser,
    });
  } catch (error) {
    console.error("Error fetching image likes:", error);
    return NextResponse.json(
      { error: "Failed to fetch image likes" },
      { status: 500 }
    );
  }
}
