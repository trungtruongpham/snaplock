import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";

type LikeStatus = {
  isLiked: boolean;
  count: number;
};

type BatchLikesState = {
  likes: Record<string, LikeStatus>;
  isLoading: boolean;
  error: string | null;
};

export function useBatchImageLikes(imageIds: string[]) {
  const [state, setState] = useState<BatchLikesState>({
    likes: {},
    isLoading: false,
    error: null,
  });
  const { user } = useUser();
  const { toast } = useToast();

  // Function to fetch likes for all images
  const fetchLikes = useCallback(async () => {
    if (imageIds.length === 0) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Create URL with all image IDs
      const url = new URL("/api/images/likes/batch", window.location.origin);
      url.searchParams.append("ids", imageIds.join(","));

      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(url.toString(), {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch like statuses: ${response.statusText}`
        );
      }

      const data = await response.json();

      setState({
        likes: data.likes || {},
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching batch likes:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : error instanceof DOMException && error.name === "AbortError"
            ? "Request timed out. Please try again."
            : "Failed to fetch like statuses",
      }));
    }
  }, [imageIds]);

  // Function to toggle like for a specific image
  const toggleLike = useCallback(
    async (imageId: string) => {
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
        // Optimistically update UI
        setState((prev) => {
          const currentLikeStatus = prev.likes[imageId] || {
            isLiked: false,
            count: 0,
          };
          const newLikes = {
            ...prev.likes,
            [imageId]: {
              isLiked: !currentLikeStatus.isLiked,
              count: currentLikeStatus.isLiked
                ? Math.max(currentLikeStatus.count - 1, 0) // Prevent negative counts
                : currentLikeStatus.count + 1,
            },
          };

          return {
            ...prev,
            likes: newLikes,
          };
        });

        // Make the API call
        const response = await fetch("/api/images/likes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageId }),
        });

        if (!response.ok) {
          throw new Error(`Failed to toggle like: ${response.statusText}`);
        }

        // Refresh all likes after a short delay to ensure changes are applied
        setTimeout(() => {
          fetchLikes();
        }, 500);
      } catch (error) {
        console.error("Error toggling like:", error);

        // Revert the optimistic update
        fetchLikes();

        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to toggle like",
          variant: "destructive",
        });
      }
    },
    [user, toast, fetchLikes]
  );

  // Fetch likes when imageIds or user changes
  useEffect(() => {
    fetchLikes();
  }, [fetchLikes, user?.id]);

  return {
    likes: state.likes,
    isLoading: state.isLoading,
    error: state.error,
    toggleLike,
    refresh: fetchLikes,
  };
}
