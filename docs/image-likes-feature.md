# Image Likes Feature

This document explains the implementation of the image likes feature, which allows users to like/dislike images stored in Supabase.

## Overview

The image likes system enables authenticated users to:

- Like and unlike images
- See the total number of likes for each image
- See which images they have liked

## Database Structure

The feature uses the following database components:

1. **`images` table**:

   - Added a `likes_count` column to track the total number of likes per image

2. **`image_likes` table**:

   - Stores the relationship between users and the images they've liked
   - Structure:
     - `id`: UUID (primary key)
     - `user_id`: References the user who liked the image
     - `image_id`: References the image that was liked
     - `created_at`: Timestamp when the like was created

3. **Database triggers**:
   - Automatically updates the `likes_count` on the images table when likes are added or removed

## Implementation Details

### API Endpoints

1. **`POST /api/images/likes`**:

   - Toggles a like for an image (adds if not present, removes if already liked)
   - Required body: `{ imageId: string }`
   - Returns: `{ success: true, action: "liked"|"unliked", isLiked: boolean }`

2. **`GET /api/images/likes?imageId=xxx`**:
   - Gets the like status and count for an image
   - Returns: `{ likes_count: number, is_liked_by_user: boolean }`

### Client-Side Components

1. **`useImageLike` Hook**:

   - Custom hook that manages the state and API calls for image likes
   - Provides:
     - `isLiked`: Whether the current user has liked the image
     - `likesCount`: The total number of likes
     - `isLoading`: Loading state during API calls
     - `toggleLike`: Function to toggle the like status
     - `refresh`: Function to refresh the like status

2. **`WallpaperCard` Component**:
   - Displays an image with like/unlike functionality
   - Shows the like count when an image has at least one like
   - Changes heart icon color when user has liked the image

## How to Use

### In a component:

```tsx
import { WallpaperCard } from "@/components/wallpaper-card";
import type { ImageWithTags } from "@/types/database";

function MyGallery({ images }: { images: ImageWithTags[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image) => (
        <WallpaperCard key={image.id} image={image} />
      ))}
    </div>
  );
}
```

### Using the hook directly:

```tsx
import { useImageLike } from "@/hooks/use-image-like";

function ImageActions({ imageId }: { imageId: string }) {
  const { isLiked, likesCount, isLoading, toggleLike } = useImageLike(imageId);

  return (
    <div>
      <button onClick={toggleLike} disabled={isLoading}>
        {isLiked ? "Unlike" : "Like"} ({likesCount})
      </button>
    </div>
  );
}
```

## Security Considerations

The feature implements Row Level Security (RLS) policies to ensure:

1. Anyone can view image likes (but not see who liked what)
2. Only authenticated users can create likes
3. Users can only delete their own likes
4. Backend validation ensures users can only like images when authenticated

## Database Migration

The migration script (`20230901000001_create_image_likes.sql`) adds:

1. The `likes_count` column to the `images` table
2. Creates the `image_likes` table
3. Sets up triggers and RLS policies
4. Adds indexes for performance optimization
