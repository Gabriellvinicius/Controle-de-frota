-- Add 'name' column to profiles if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name text;

-- Update the admin user with the specific name requested
UPDATE profiles 
SET name = 'Gabriel Caldas' 
WHERE role = 'admin';

-- Policy update (ensure users can update their own name)
DROP POLICY IF EXISTS "Users can update own name" ON profiles;
CREATE POLICY "Users can update own details" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
