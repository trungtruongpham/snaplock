import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Tag } from "@/types/database";
import { WallpaperGridWithFilters } from "@/components/wallpaper-grid-with-filters";
import { Metadata } from "next";

// Define page-specific metadata
export const metadata: Metadata = {
  title: "SnapsLock Wallpapers | Beautiful HD Wallpapers Collection",
  description:
    "Browse and download our collection of beautiful HD wallpapers for your mobile, tablet, or desktop. Find the perfect wallpaper in our curated gallery.",
  openGraph: {
    title: "SnapsLock Wallpapers | Beautiful HD Wallpapers Collection",
    description:
      "Browse and download our collection of beautiful HD wallpapers for your mobile, tablet, or desktop. Find the perfect wallpaper in our curated gallery.",
  },
};

// This enables Static Site Generation
export const revalidate = 3600; // Revalidate at most once per hour

async function getInitialData() {
  try {
    const supabase = await createClient();

    // Fetch initial images (first page)
    const limit = 12; // Same as pageSize in client-side fetching

    // Get images with pagination
    const { data: imagesData, error: imagesError } = await supabase
      .from("images")
      .select("*, likes_count")
      .order("created_at", { ascending: false })
      .range(0, limit - 1);

    if (imagesError) {
      throw imagesError;
    }

    // Fetch tags data
    const { data: allTags, error: tagsError } = await supabase
      .from("tags")
      .select("*")
      .order("name");

    if (tagsError) {
      throw tagsError;
    }

    // Get popular/trending tags (based on frequency of use)
    const { data: popularTagsData } = await supabase
      .from("images_tags")
      .select("tag_id, count")
      .order("count", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        // If count column doesn't exist, we'll calculate it manually
        if (data && data.length > 0 && data[0].count) {
          return { data };
        } else {
          // Calculate tag counts manually
          return supabase
            .from("images_tags")
            .select("tag_id")
            .then(({ data }) => {
              const counts: Record<string, number> = {};
              data?.forEach((item) => {
                counts[item.tag_id] = (counts[item.tag_id] || 0) + 1;
              });

              const sortedTags = Object.entries(counts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([tag_id]) => ({ tag_id }));

              return { data: sortedTags };
            });
        }
      });

    const popularTagIds = popularTagsData?.map((item) => item.tag_id) || [];
    const popularTags =
      allTags?.filter((tag) => popularTagIds.includes(tag.id)) || [];

    // Fetch image-tag relationships for these images
    const fetchedImageIds = (imagesData || []).map((img) => img.id);

    let imagesWithTags = [];

    if (fetchedImageIds.length > 0) {
      const { data: imageTagRelations, error: imageTagsError } = await supabase
        .from("images_tags")
        .select("image_id, tag_id")
        .in("image_id", fetchedImageIds);

      if (imageTagsError) {
        throw imageTagsError;
      }

      // Get all unique tag IDs
      const tagIds = [
        ...new Set((imageTagRelations || []).map((it) => it.tag_id)),
      ];

      // Fetch all tags for these images
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

      // Combine everything
      imagesWithTags = imagesData.map((image) => {
        // Find all tag IDs for this image
        const thisImageTagIds = (imageTagRelations || [])
          .filter((it) => it.image_id === image.id)
          .map((it) => it.tag_id);

        // Find the tag objects for these IDs
        const thisImageTags = tagsData.filter((tag) =>
          thisImageTagIds.includes(tag.id)
        );

        return {
          ...image,
          tags: thisImageTags,
        };
      });
    }

    // Count for pagination
    const { count, error: countError } = await supabase
      .from("images")
      .select("*", { count: "exact", head: true });

    if (countError) {
      throw countError;
    }

    return {
      images: imagesWithTags,
      totalCount: count || 0,
      hasMore: count ? limit < count : false,
      tags: allTags || [],
      popularTags: popularTags || [],
    };
  } catch (error) {
    console.error("Error fetching initial data:", error);
    return {
      images: [],
      totalCount: 0,
      hasMore: false,
      tags: [],
      popularTags: [],
    };
  }
}

export default async function HomePage() {
  const initialData = await getInitialData();

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container mx-auto px-4">
        <Suspense
          fallback={
            <div className="text-center py-10">
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
              <p className="mt-2 text-muted-foreground">Loading...</p>
            </div>
          }
        >
          <WallpaperGridWithFilters initialData={initialData} />
        </Suspense>
      </main>
    </div>
  );
}
