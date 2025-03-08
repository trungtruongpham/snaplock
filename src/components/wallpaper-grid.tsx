"use client";

import Image from "next/image";
import { Heart, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, downloadImage } from "@/lib/utils";
import { CloudinaryImage } from "@/lib/cloudinary";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface WallpaperCardProps {
  cloudinaryImage: CloudinaryImage;
  isLiked?: boolean;
  onLike?: () => void;
}

function WallpaperCard({
  cloudinaryImage,
  isLiked = false,
  onLike,
}: WallpaperCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const filename = `${cloudinaryImage.public_id.split("/").pop()}.jpg`;
      await downloadImage(cloudinaryImage.secure_url, filename);
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
        src={cloudinaryImage.secure_url}
        alt={cloudinaryImage.public_id}
        width={cloudinaryImage.width}
        height={cloudinaryImage.height}
        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
        className="object-cover transition-transform group-hover:scale-105"
        style={{ position: "relative" }}
      />
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

export function WallpaperGrid({ images }: { images: CloudinaryImage[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.length === 0 ? (
        <>
          <WallpaperCardSkeleton />
          <WallpaperCardSkeleton />
          <WallpaperCardSkeleton />
          <WallpaperCardSkeleton />
          <WallpaperCardSkeleton />
          <WallpaperCardSkeleton />
          <WallpaperCardSkeleton />
          <WallpaperCardSkeleton />
        </>
      ) : (
        images.map((image, i) => (
          <WallpaperCard
            key={i}
            cloudinaryImage={image}
            isLiked={false}
            onLike={() => {}}
          />
        ))
      )}
    </div>
  );
}
