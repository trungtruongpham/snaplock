"use client";

import { useState, useEffect, useMemo } from "react";
import { WallpaperGrid } from "@/components/wallpaper-grid";
import { TagChips } from "@/components/tag-chips";
import { ImageWithTags, Tag } from "@/types/database";
import { Loader2 } from "lucide-react";
import { useBatchImageLikes } from "@/hooks/use-batch-image-likes";

interface InitialData {
  images: ImageWithTags[];
  totalCount: number;
  hasMore: boolean;
  tags: Tag[];
  popularTags?: Tag[];
}

interface WallpaperGridWithFiltersProps {
  initialData: InitialData;
}

export function WallpaperGridWithFilters({
  initialData,
}: WallpaperGridWithFiltersProps) {
  // State for selected tags
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // State for images
  const [images, setImages] = useState<ImageWithTags[]>(initialData.images);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);

  // Extract image IDs for the batch likes hook
  const imageIds = useMemo(() => images.map((img) => img.id), [images]);

  // Use the batch likes hook
  const { likes: likesStatus, toggleLike } = useBatchImageLikes(imageIds);

  // Handle tag toggle
  const handleTagToggle = (tagName: string) => {
    setSelectedTags((prevSelectedTags) => {
      // Check if this tag is already selected
      if (prevSelectedTags.includes(tagName)) {
        // If so, remove it
        return prevSelectedTags.filter((tag) => tag !== tagName);
      } else {
        // Otherwise, add it
        return [...prevSelectedTags, tagName];
      }
    });
  };

  // Clear all selected tags
  const clearAllTags = () => {
    setSelectedTags([]);
  };

  // Fetch images when tags or page changes
  useEffect(() => {
    // Skip initial render when we already have preloaded data
    if (page === 1 && selectedTags.length === 0 && images.length > 0) {
      return;
    }

    async function fetchImages() {
      try {
        setIsLoading(page === 1 && selectedTags.length > 0);
        setError(null);

        if (page === 1) {
          setIsFetchingMore(false);
        }

        // Build the URL with pagination parameters
        const url = new URL("/api/images", window.location.origin);
        const pageSize = 12; // Same as in the server component

        // Add tag parameters if tags are selected
        if (selectedTags.length > 0) {
          // Clear any existing tag parameters
          url.searchParams.delete("tag");

          // Add each tag as a separate tag parameter
          selectedTags.forEach((tag) => {
            url.searchParams.append("tag", tag);
          });
        }

        url.searchParams.append("page", page.toString());
        url.searchParams.append("pageSize", pageSize.toString());

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error("Failed to fetch images");
        }

        const data = await response.json();

        if (page === 1) {
          // If it's the first page, replace the images array
          setImages(data.images || []);
        } else {
          // Otherwise, append to the existing array avoiding duplicates
          setImages((prev) => {
            const newImages = data.images || [];
            const existingIds = new Set(prev.map((img) => img.id));
            const uniqueNewImages = newImages.filter(
              (img: ImageWithTags) => !existingIds.has(img.id)
            );
            return [...prev, ...uniqueNewImages];
          });
        }

        setHasMore(data.hasMore || false);
      } catch (error) {
        setError(error instanceof Error ? error : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    }

    fetchImages();
  }, [page, selectedTags]);

  // Reset to page 1 when tags change
  useEffect(() => {
    setPage(1);
  }, [selectedTags, images.length]);

  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    function setupObserver() {
      // If no more data or already loading, don't observe
      if (!hasMore || isLoading || isFetchingMore) {
        return;
      }

      // Create an observer to detect when user scrolls near the bottom
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setIsFetchingMore(true);
            setPage((prevPage) => prevPage + 1);
          }
        },
        {
          threshold: 0.1,
          rootMargin: "200px", // Larger margin to load earlier
        }
      );

      // Add the observer to a sentinel element at the bottom of the list
      const sentinel = document.getElementById("scroll-sentinel");
      if (sentinel) {
        observer.observe(sentinel);
      }

      return observer;
    }

    // Setup with a slight delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const observer = setupObserver();

      return () => {
        if (observer) {
          observer.disconnect();
        }
      };
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [hasMore, isLoading, isFetchingMore]);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 mt-6">
        {selectedTags.length > 0 && (
          <button
            onClick={clearAllTags}
            className="text-sm text-muted-foreground hover:text-primary mt-2 md:mt-0"
          >
            Clear all filters ({selectedTags.length})
          </button>
        )}
      </div>

      <TagChips
        selectedTags={selectedTags}
        onTagToggle={handleTagToggle}
        className="mb-8"
        initialTags={initialData.tags}
      />

      {error && (
        <div className="bg-destructive/15 text-destructive rounded-md p-4 mb-8">
          <p>Failed to load images: {error.message}</p>
        </div>
      )}

      <WallpaperGrid
        images={images}
        isLoading={isLoading}
        isFetchingMore={isFetchingMore}
        hasMore={hasMore}
        onToggleLike={toggleLike}
        likesStatus={likesStatus}
      />

      {isLoading && !isFetchingMore && (
        <div className="text-center py-10">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      )}

      {!isLoading && !isFetchingMore && images.length > 0 && !hasMore && (
        <div className="text-center py-8 text-muted-foreground">
          <p>You&apos;ve reached the end!</p>
        </div>
      )}
    </>
  );
}
