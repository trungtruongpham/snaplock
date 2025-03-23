-- Function to find images that have ALL of the specified tags
CREATE OR REPLACE FUNCTION get_images_with_all_tags(tag_ids UUID[])
RETURNS TABLE (image_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT it.image_id
  FROM images_tags it
  WHERE it.tag_id = ANY(tag_ids)
  GROUP BY it.image_id
  HAVING COUNT(DISTINCT it.tag_id) = array_length(tag_ids, 1);
END;
$$ LANGUAGE plpgsql;

-- Function to toggle image like status in a transaction
CREATE OR REPLACE FUNCTION toggle_image_like(p_user_id UUID, p_image_id UUID) 
RETURNS void AS $$
DECLARE
  v_like_id UUID;
  v_likes_count INT;
BEGIN
  -- Check if the user has already liked this image
  SELECT id INTO v_like_id
  FROM image_likes
  WHERE user_id = p_user_id AND image_id = p_image_id;
  
  IF v_like_id IS NOT NULL THEN
    -- User already liked the image, so remove the like
    DELETE FROM image_likes WHERE id = v_like_id;
  ELSE
    -- User hasn't liked the image, so add a like
    INSERT INTO image_likes (user_id, image_id)
    VALUES (p_user_id, p_image_id);
  END IF;
  
  -- Count current likes for this image
  SELECT COUNT(*) INTO v_likes_count
  FROM image_likes
  WHERE image_id = p_image_id;
  
  -- Update the likes_count on the image
  UPDATE images
  SET likes_count = v_likes_count
  WHERE id = p_image_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE; -- Just re-raise the exception without explicit ROLLBACK
END;
$$ LANGUAGE plpgsql; 