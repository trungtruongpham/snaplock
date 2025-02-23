"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Grid2X2, Camera, Cat, Palette, Building2, User } from "lucide-react";

const topics = [
  { id: "all", label: "All", icon: Grid2X2 },
  { id: "photography", label: "Photography", icon: Camera },
  { id: "animals", label: "Animals", icon: Cat },
  { id: "anime", label: "Anime", icon: Palette },
  { id: "architecture", label: "Architecture", icon: Building2 },
  { id: "characters", label: "Characters", icon: User },
] as const;

interface TopicFilterProps {
  activeTopic: string;
  onChange: (topic: string) => void;
}

export function TopicFilter({ activeTopic, onChange }: TopicFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto py-4 px-4 md:px-0 no-scrollbar">
      {topics.map((topic) => {
        const Icon = topic.icon;
        return (
          <Button
            key={topic.id}
            variant={activeTopic === topic.id ? "default" : "secondary"}
            className={cn(
              "rounded-full px-4 py-2",
              activeTopic === topic.id
                ? "bg-primary hover:bg-primary/90"
                : "bg-secondary/50 hover:bg-secondary/80"
            )}
            onClick={() => onChange(topic.id)}
          >
            <Icon className="w-4 h-4 mr-2" />
            {topic.label}
          </Button>
        );
      })}
    </div>
  );
}
