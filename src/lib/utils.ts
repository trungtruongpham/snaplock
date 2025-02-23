import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function downloadImage(url: string, filename: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename; // This will be the downloaded file name
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error("Error downloading image:", error);
  }
}
