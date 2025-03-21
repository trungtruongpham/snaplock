"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ImageWithTags } from "@/types/database";

interface UseImagesResult {
  images: ImageWithTags[];
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  error: Error | null;
}

export function useImages(tags: string[] = []): UseImagesResult {
  const [images, setImages] = useState<ImageWithTags[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 12; // Number of images per page
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // This ref helps avoid re-fetching on component re-renders
  const tagsRef = useRef<string[]>(tags);

  // Reset pagination when tags change
  useEffect(() => {
    // Compare arrays - if tags selection changed
    const tagsChanged =
      tagsRef.current.length !== tags.length ||
      tags.some((tag) => !tagsRef.current.includes(tag)) ||
      tagsRef.current.some((tag) => !tags.includes(tag));

    if (tagsChanged) {
      setImages([]);
      setPage(1);
      setHasMore(true);
      tagsRef.current = [...tags];
    }
  }, [tags]);

  // Initial data loading
  useEffect(() => {
    async function fetchImages() {
      if (!hasMore && images.length > 0 && page > 1) return;

      try {
        setIsLoading(page === 1);
        setError(null);

        // Build the URL with pagination parameters
        const url = new URL("/api/images", window.location.origin);

        // Add tag parameters if tags are selected
        if (tags.length > 0) {
          // Clear any existing tag parameters
          url.searchParams.delete("tag");

          // Add each tag as a separate tag parameter
          tags.forEach((tag) => {
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
  }, [page, tags, hasMore, images.length]);

  // Function to load more images (called when user scrolls to bottom)
  const loadMore = useCallback(() => {
    if (!isLoading && !isFetchingMore && hasMore) {
      setIsFetchingMore(true);
      setPage((prevPage) => prevPage + 1);
    }
  }, [isLoading, isFetchingMore, hasMore]);

  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    function setupObserver() {
      // Disconnect previous observer if it exists
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      // If no more data or already loading, don't observe
      if (!hasMore || isLoading || isFetchingMore) {
        return;
      }

      // Create an observer to detect when user scrolls near the bottom
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadMore();
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
        observerRef.current.observe(sentinel);
        sentinelRef.current = sentinel as HTMLDivElement;
      }
    }

    // Setup with a slight delay to ensure DOM is ready
    const timeoutId = setTimeout(setupObserver, 100);

    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, isFetchingMore, loadMore]);

  return { images, isLoading, isFetchingMore, hasMore, error };
}
