import { v2 as cloudinary } from "cloudinary";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder") ?? "wallpapers";
    const { resources } = await cloudinary.search
      .expression(`folder:${folder}/*`)
      .max_results(500)
      .execute();

    return NextResponse.json(resources);
  } catch (error) {
    console.error("Error fetching images:", error);
    redirect("/error");
  }
}
