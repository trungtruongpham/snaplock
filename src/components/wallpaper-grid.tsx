"use client";

import { Loader2 } from "lucide-react";
import { CloudinaryImage } from "@/lib/cloudinary";
import { useState, useEffect } from "react";
import type { ImageWithTags } from "@/types/database";
import { WallpaperCard } from "@/components/wallpaper-card";

function WallpaperCardSkeleton() {
  return (
    <div className="group relative rounded-lg overflow-hidden">
      <div className="aspect-[2/3] w-full sm:w-[33vw] md:w-[25vw] bg-muted animate-pulse" />
      <div className="absolute bottom-2 right-2 flex gap-2">
        <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
        <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="col-span-full flex justify-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

// Accept both ImageWithTags and CloudinaryImage for backward compatibility
type GridImageType = ImageWithTags | (CloudinaryImage & { id?: string });

type LikeStatus = {
  isLiked: boolean;
  count: number;
};

interface WallpaperGridProps {
  images: GridImageType[];
  isLoading?: boolean;
  isFetchingMore?: boolean;
  hasMore?: boolean;
  likesStatus?: Record<string, LikeStatus>;
  onToggleLike?: (imageId: string) => Promise<void>;
}

export function WallpaperGrid({
  images,
  isLoading = false,
  isFetchingMore = false,
  hasMore = false,
  likesStatus = {},
  onToggleLike = async () => {},
}: WallpaperGridProps) {
  const [skeletonCount, setSkeletonCount] = useState(8);

  // Calculate skeleton count based on screen height
  useEffect(() => {
    function calculateSkeletonCount() {
      // Get viewport height
      const viewportHeight = window.innerHeight;
      // Get approximate card height (aspect ratio 2:3)
      const cardWidth =
        window.innerWidth >= 1024
          ? window.innerWidth * 0.25 // lg screen: 25vw
          : window.innerWidth >= 768
          ? window.innerWidth * 0.33 // md screen: 33vw
          : window.innerWidth * 0.5; // sm screen: 50vw

      const cardHeight = cardWidth * 1.5; // Aspect ratio 2:3

      // Gap between cards (assuming 1rem = 16px)
      const gap = 16;

      // Calculate rows fitting in viewport (subtract some height for the header)
      const rowsInViewport = Math.ceil(
        (viewportHeight - 120) / (cardHeight + gap)
      );

      // Calculate number of cards per row
      const cardsPerRow =
        window.innerWidth >= 1024
          ? 4 // lg screen: 4 cols
          : window.innerWidth >= 768
          ? 3 // md screen: 3 cols
          : 2; // sm screen: 2 cols

      // Calculate total skeletons with a minimum of 1 row and a maximum of 3 rows
      const calculatedCount =
        cardsPerRow * Math.min(Math.max(rowsInViewport, 1), 3);

      setSkeletonCount(calculatedCount);
    }

    calculateSkeletonCount();

    // Recalculate on window resize
    window.addEventListener("resize", calculateSkeletonCount);

    return () => {
      window.removeEventListener("resize", calculateSkeletonCount);
    };
  }, []);

  // Render skeletons
  const renderSkeletons = () => {
    return Array(skeletonCount)
      .fill(0)
      .map((_, index) => <WallpaperCardSkeleton key={`skeleton-${index}`} />);
  };

  // Empty state
  if (!isLoading && images.length === 0) {
    return (
      <div className="col-span-full text-center py-20">
        <p className="text-muted-foreground text-lg">No images found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Show skeleton for initial load */}
        {isLoading && !isFetchingMore ? (
          renderSkeletons()
        ) : (
          <>
            {images.map((image, i) => {
              const imageId = image.id || `cloudinary-${image.public_id}`;
              const likeStatus = likesStatus[imageId] || {
                isLiked: false,
                count: 0,
              };

              return (
                <WallpaperCard
                  key={`image-${i}`}
                  image={image as ImageWithTags}
                  likeStatus={likeStatus}
                  onToggleLike={onToggleLike}
                />
              );
            })}
          </>
        )}
      </div>

      {/* Loading spinner for fetching more images */}
      {isFetchingMore && <LoadingSpinner />}

      {/* Improved sentinel element for intersection observer */}
      {hasMore && images.length > 0 && !isLoading && !isFetchingMore && (
        <div
          id="scroll-sentinel"
          className="flex justify-center items-center h-24 w-full mt-6 mb-4"
        >
          <div className="w-32 h-1 bg-muted rounded-full">
            <div className="w-8 h-1 bg-primary rounded-full animate-pulse"></div>
          </div>
        </div>
      )}

      {/* "End of content" message */}
      {!isLoading && !isFetchingMore && images.length > 0 && !hasMore && (
        <div className="text-center py-8 text-muted-foreground">
          <p>You&apos;ve reached the end of the gallery</p>
        </div>
      )}
    </div>
  );
}
