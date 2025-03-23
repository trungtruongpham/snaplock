-- Add likes_count column to images table if it doesn't exist
ALTER TABLE IF EXISTS images
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Create image_likes table
CREATE TABLE IF NOT EXISTS image_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, image_id)
);

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_image_likes_user_id ON image_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_image_likes_image_id ON image_likes(image_id);

-- Create function to update likes_count on the images table
CREATE OR REPLACE FUNCTION update_image_likes_count()
RETURNS TRIGGER AS $$
DECLARE
  image_id_val UUID;
  likes_count_val INTEGER;
BEGIN
  -- Determine which image_id to update based on whether this is an INSERT or DELETE
  IF TG_OP = 'INSERT' THEN
    image_id_val := NEW.image_id;
  ELSE
    image_id_val := OLD.image_id;
  END IF;
  
  -- Count likes for this image
  SELECT COUNT(*) INTO likes_count_val
  FROM image_likes
  WHERE image_id = image_id_val;
  
  -- Update the likes_count on the images table
  UPDATE images
  SET likes_count = likes_count_val
  WHERE id = image_id_val;
  
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  ELSE
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update likes_count when likes change
DROP TRIGGER IF EXISTS update_image_likes_count_trigger ON image_likes;
CREATE TRIGGER update_image_likes_count_trigger
AFTER INSERT OR DELETE ON image_likes
FOR EACH ROW
EXECUTE FUNCTION update_image_likes_count();

-- Row Level Security
ALTER TABLE image_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see all likes
CREATE POLICY "Anyone can view image likes" ON image_likes
FOR SELECT USING (true);

-- Policy: Only authenticated users can create likes
CREATE POLICY "Authenticated users can create likes" ON image_likes
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own likes
CREATE POLICY "Users can delete own likes" ON image_likes
FOR DELETE TO authenticated 
USING (auth.uid() = user_id); 