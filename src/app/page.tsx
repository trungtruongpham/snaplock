"use client";

import { WallpaperGrid } from "@/components/wallpaper-grid";
import { useImages } from "@/hooks/use-images";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { TagChips } from "@/components/tag-chips";

export default function HomePage() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { images, isLoading, isFetchingMore, hasMore, error } =
    useImages(selectedTags);

  // Handle a single tag toggle
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

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container mx-auto px-4">
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
        />

        {isLoading && !isFetchingMore && (
          <div className="text-center py-10">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">Loading images...</p>
          </div>
        )}

        {!isLoading && !isFetchingMore && images.length > 0 && !hasMore && (
          <div className="text-center py-8 text-muted-foreground">
            <p>You&apos;ve reached the end!</p>
          </div>
        )}
      </main>
    </div>
  );
}
