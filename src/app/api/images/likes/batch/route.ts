import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageIdsParam = searchParams.get("ids");

    if (!imageIdsParam) {
      return NextResponse.json({ error: "Missing image IDs" }, { status: 400 });
    }

    // Parse the comma-separated image IDs
    const imageIds = imageIdsParam.split(",").filter(Boolean);

    if (imageIds.length === 0) {
      return NextResponse.json({ likes: {} });
    }

    // Get Supabase client and user session
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    // Query the database to get like information for all images
    const { data: likesData, error } = await supabase
      .from("images")
      .select(
        `
        id,
        likes_count,
        image_likes!inner (
          user_id
        )
      `
      )
      .in("id", imageIds);

    if (error) {
      console.error("Error fetching batch likes:", error);
      return NextResponse.json(
        { error: "Failed to fetch like data" },
        { status: 500 }
      );
    }

    // Process the data to create a map of image ID to like status
    const likesMap: Record<string, { isLiked: boolean; count: number }> = {};

    // Initialize the map with all requested image IDs (in case some have no likes)
    imageIds.forEach((id) => {
      likesMap[id] = { isLiked: false, count: 0 };
    });

    // Update the map with actual like data
    likesData?.forEach((image) => {
      const userLikes = image.image_likes || [];
      const isLiked = userId
        ? userLikes.some((like) => like.user_id === userId)
        : false;

      likesMap[image.id] = {
        isLiked,
        count: image.likes_count || userLikes.length || 0,
      };
    });

    return NextResponse.json({ likes: likesMap });
  } catch (error) {
    console.error("Error processing batch likes request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
