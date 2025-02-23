"use client";

import { useState, useEffect } from "react";
import { CloudinaryImage, getImagesFromFolder } from "@/lib/cloudinary";

export function useImages(topic: string) {
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchImages() {
      setIsLoading(true);
      try {
        const folderPath =
          topic === "all" ? "wallpapers" : `wallpapers/${topic}`;
        const fetchedImages = await getImagesFromFolder({ folderPath });
        setImages(fetchedImages);
      } catch (error) {
        console.error("Failed to fetch images:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchImages();
  }, [topic]);

  return { images, isLoading };
}
