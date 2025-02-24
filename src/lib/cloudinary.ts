export interface CloudinaryImage {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
}

export async function getImagesFromFolder({
  folderPath,
}: {
  folderPath: string;
  maxResults?: number;
}): Promise<CloudinaryImage[]> {
  try {
    const response = await fetch(`/api/cloudinary?folder=${folderPath}`);

    if (!response.ok) throw new Error("Failed to fetch images");

    const resources = await response.json();
    return resources.map((resource: CloudinaryImage) => ({
      public_id: resource.public_id,
      secure_url: resource.secure_url,
      width: resource.width,
      height: resource.height,
      format: resource.format,
    }));
  } catch (error) {
    console.error("Error fetching images:", error);
    return [];
  }
}
