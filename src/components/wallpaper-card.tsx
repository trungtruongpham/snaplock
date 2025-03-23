"use client";

import Image from "next/image";
import { Heart, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, downloadImage } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { ImageWithTags } from "@/types/database";
import { Badge } from "@/components/ui/badge";

interface WallpaperCardProps {
  image: ImageWithTags;
  likeStatus: { isLiked: boolean; count: number };
  onToggleLike: (imageId: string) => Promise<void>;
}

export function WallpaperCard({
  image,
  likeStatus,
  onToggleLike,
}: WallpaperCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
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

  const handleLike = async () => {
    setIsLikeLoading(true);
    try {
      await onToggleLike(image.id);
    } finally {
      setIsLikeLoading(false);
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
          {image.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="bg-black/60 text-white backdrop-blur-sm"
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Like count indicator - always shown */}
      <div className="absolute top-2 right-2">
        <Badge
          variant="secondary"
          className="bg-black/60 text-white backdrop-blur-sm flex items-center gap-1 transition-all duration-300"
        >
          <Heart
            className={cn(
              "w-3 h-3 transition-colors duration-300",
              likeStatus.isLiked && "fill-current text-red-500"
            )}
          />
          {likeStatus.count}
        </Badge>
      </div>

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
        <Button
          variant="secondary"
          size="icon"
          onClick={handleLike}
          disabled={isLikeLoading}
          className="transition-all duration-300"
        >
          <Heart
            className={cn(
              "w-5 h-5 transition-colors duration-300",
              isLikeLoading && "animate-pulse",
              likeStatus.isLiked && "fill-current text-red-500"
            )}
          />
        </Button>
      </div>
    </div>
  );
}
