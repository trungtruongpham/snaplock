import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://snapslockwallpapers.com";

  // Get a list of all image pages
  const supabase = await createClient();
  const { data: images } = await supabase
    .from("images")
    .select("id, created_at, updated_at")
    .order("created_at", { ascending: false });

  // Get all tag slugs
  const { data: tags } = await supabase.from("tags").select("slug, created_at");

  // Base routes
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/upload`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
  ];

  // Add image routes
  const imageRoutes =
    images?.map((image) => ({
      url: `${baseUrl}/image/${image.id}`,
      lastModified: new Date(image.updated_at || image.created_at),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })) || [];

  // Add tag routes
  const tagRoutes =
    tags?.map((tag) => ({
      url: `${baseUrl}/tag/${tag.slug}`,
      lastModified: new Date(tag.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })) || [];

  return [...routes, ...imageRoutes, ...tagRoutes];
}
