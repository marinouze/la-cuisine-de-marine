-- Add foreign key constraint to link recipes.user_id to profiles.id
-- This is required for joining recipes with profiles to get author usernames

ALTER TABLE recipes
ADD CONSTRAINT fk_recipes_user_id 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- Note: If you get an error about existing data, run this first:
-- UPDATE recipes SET user_id = NULL WHERE user_id NOT IN (SELECT id FROM auth.users);
