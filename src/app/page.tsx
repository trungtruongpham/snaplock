"use client";

import { useSearchParams } from "next/navigation";
import { TopicFilter } from "@/components/topic-filter";
import { WallpaperGrid } from "@/components/wallpaper-grid";
import { useImages } from "@/hooks/use-images";
import router from "next/router";

export default function HomePage() {
  const searchParams = useSearchParams();
  const topic = searchParams.get("topic") || "all";
  const { images, isLoading } = useImages(topic);

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <TopicFilter
          activeTopic={topic}
          onChange={(topic: string) => {
            router.push(`/?topic=${topic}`);
          }}
        />
        <WallpaperGrid images={images} />
      </main>
    </div>
  );
}
