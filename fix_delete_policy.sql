-- EXECUT THIS SCRIPT IN SUPABASE SQL EDITOR

-- 1. Drop the existing policy to avoid conflicts
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

-- 2. Create the correct policy
CREATE POLICY "Users can delete own tasks" 
  ON tasks FOR DELETE 
  USING (auth.uid() = user_id);

-- 3. Verify it works
-- You can verify by running: 
-- SELECT * FROM pg_policies WHERE tablename = 'tasks';
