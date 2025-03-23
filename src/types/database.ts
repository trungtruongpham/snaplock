export interface Image {
  id: string;
  title: string;
  description?: string;
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  usage_count?: number; // Number of times this tag is used
}

export interface ImageTag {
  image_id: string;
  tag_id: string;
}

// Interface for image likes
export interface ImageLike {
  id: string;
  user_id: string;
  image_id: string;
  created_at: string;
}

export type ImageWithTags = Image & {
  tags: Tag[];
};

// Extended image type that includes like information
export type ImageWithLikes = Image & {
  likes_count: number;
  is_liked_by_user: boolean;
};

// Complete image type with both tags and likes
export type ImageWithTagsAndLikes = ImageWithTags & ImageWithLikes;
