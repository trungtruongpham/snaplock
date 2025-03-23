import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";

type LikeStatus = {
  isLiked: boolean;
  likesCount: number;
  isLoading: boolean;
  error: string | null;
};

type UseLikeHookReturn = LikeStatus & {
  toggleLike: () => Promise<void>;
  refresh: () => Promise<void>;
};

export function useImageLike(imageId: string): UseLikeHookReturn {
  const [likeStatus, setLikeStatus] = useState<LikeStatus>({
    isLiked: false,
    likesCount: 0,
    isLoading: true,
    error: null,
  });
  const { user } = useUser();
  const { toast } = useToast();

  const fetchLikeStatus = async () => {
    if (!imageId) return;

    try {
      setLikeStatus((prev) => ({ ...prev, isLoading: true, error: null }));

      const url = new URL(`/api/images/likes`, window.location.origin);
      url.searchParams.append("imageId", imageId);

      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(url.toString(), {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch like status: ${response.statusText}`);
      }

      const data = await response.json();

      setLikeStatus({
        isLiked: data.is_liked_by_user,
        likesCount: data.likes_count,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching like status:", error);
      setLikeStatus((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : error instanceof DOMException && error.name === "AbortError"
            ? "Request timed out. Please try again."
            : "Failed to fetch like status",
      }));
    }
  };

  const toggleLike = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like images",
        variant: "destructive",
      });
      return;
    }

    if (!imageId) return;

    try {
      setLikeStatus((prev) => ({ ...prev, isLoading: true, error: null }));

      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch("/api/images/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to toggle like: ${response.statusText}`);
      }

      const data = await response.json();

      // Optimistically update the UI
      setLikeStatus((prev) => ({
        ...prev,
        isLiked: data.isLiked,
        likesCount: data.isLiked
          ? prev.likesCount + 1
          : Math.max(prev.likesCount - 1, 0), // Prevent negative counts
        isLoading: false,
        error: null,
      }));

      // Add a small delay before refreshing to avoid race conditions
      setTimeout(() => {
        fetchLikeStatus();
      }, 500);
    } catch (error) {
      console.error("Error toggling like:", error);
      setLikeStatus((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : error instanceof DOMException && error.name === "AbortError"
            ? "Request timed out. Please try again."
            : "Failed to toggle like",
      }));

      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : error instanceof DOMException && error.name === "AbortError"
            ? "Request timed out. Please try again."
            : "Failed to toggle like",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (imageId) {
      fetchLikeStatus();
    }
  }, [imageId, user?.id]);

  return {
    ...likeStatus,
    toggleLike,
    refresh: fetchLikeStatus,
  };
}
