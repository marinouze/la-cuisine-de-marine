-- Update RLS policies to use role from profiles table instead of email checks

-- Step 1: Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop old email-based admin policies
DROP POLICY IF EXISTS "Admins can view all recipes" ON recipes;
DROP POLICY IF EXISTS "Admins can update any recipe" ON recipes;
DROP POLICY IF EXISTS "Admins can delete any recipe" ON recipes;

-- Step 3: Create new role-based admin policies
CREATE POLICY "Admins can update any recipe" 
ON recipes FOR UPDATE 
USING (public.is_admin());

CREATE POLICY "Admins can delete any recipe" 
ON recipes FOR DELETE 
USING (public.is_admin());
