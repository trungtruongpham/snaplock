"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Tag } from "@/types/database";
import { X } from "lucide-react";

interface TagChipsProps {
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  className?: string;
}

export function TagChips({
  selectedTags,
  onTagToggle,
  className,
}: TagChipsProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchTags() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/tags");
        if (!response.ok) {
          throw new Error("Failed to fetch tags");
        }
        const data = await response.json();
        setTags(data.tags || []);
      } catch {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load tags. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchTags();
  }, [toast, selectedTags]);

  const handleTagClick = (tagSlug: string) => {
    onTagToggle(tagSlug);
  };

  if (isLoading) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="h-8 w-16 rounded-full bg-muted animate-pulse"
            />
          ))}
      </div>
    );
  }

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag.name);
          return (
            <Badge
              key={tag.id}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "cursor-pointer hover:bg-primary/90 transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:text-primary-foreground"
              )}
              onClick={() => handleTagClick(tag.name)}
            >
              {tag.name}
              {isSelected && (
                <span className="ml-1 inline-flex items-center">
                  <X className="h-3 w-3" />
                </span>
              )}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
