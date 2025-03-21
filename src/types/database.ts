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
}

export interface ImageTag {
  image_id: string;
  tag_id: string;
}

export type ImageWithTags = Image & {
  tags: Tag[];
};
