"use client";

import Image from "next/image";
import { Heart, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, downloadImage } from "@/lib/utils";
import { CloudinaryImage } from "@/lib/cloudinary";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { ImageWithTags, Tag } from "@/types/database";

interface WallpaperCardProps {
  image: ImageWithTags;
  isLiked?: boolean;
  onLike?: () => void;
}

function WallpaperCard({ image, isLiked = false, onLike }: WallpaperCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const filename = `${image.public_id.split("/").pop()}.jpg`;
      await downloadImage(image.secure_url, filename);
      toast({
        title: "Success",
        description: "Image downloaded successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to download image. ${error}`,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="group relative rounded-lg overflow-hidden">
      <Image
        src={image.secure_url}
        alt={image.title || image.public_id}
        width={image.width}
        height={image.height}
        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
        className="object-cover transition-transform group-hover:scale-105"
        style={{ position: "relative" }}
      />
      {image.tags && image.tags.length > 0 && (
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[80%]">
          {image.tags.slice(0, 3).map((tag: Tag) => (
            <span
              key={tag.id}
              className="px-2 py-1 text-xs rounded-full bg-black/60 text-white backdrop-blur-sm"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
      <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
        <Button variant="secondary" size="icon" onClick={onLike}>
          <Heart
            className={cn("w-5 h-5", isLiked && "fill-current text-red-500")}
          />
        </Button>
      </div>
    </div>
  );
}

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
type GridImageType = ImageWithTags | CloudinaryImage;

interface WallpaperGridProps {
  images: GridImageType[];
  isLoading?: boolean;
  isFetchingMore?: boolean;
  hasMore?: boolean;
}

export function WallpaperGrid({
  images,
  isLoading = false,
  isFetchingMore = false,
  hasMore = false,
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
            {images.map((image, i) => (
              <WallpaperCard
                key={`image-${i}`}
                image={image as ImageWithTags}
                isLiked={false}
                onLike={() => {}}
              />
            ))}
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
