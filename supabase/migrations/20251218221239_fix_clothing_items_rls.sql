-- Drop the existing "FOR ALL" policy and create specific policies for each operation
DROP POLICY IF EXISTS "Admins can manage clothing items" ON clothing_items;

-- Create specific policies for INSERT, UPDATE, and DELETE
CREATE POLICY "Admins can insert clothing items" ON clothing_items 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update clothing items" ON clothing_items 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can delete clothing items" ON clothing_items 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

