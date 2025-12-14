-- Enable Row Level Security (RLS) on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clothing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for users table (users can read/update their own data, admins can do everything)
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can do everything on users" ON users FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Create policies for clothing_items (everyone can read, only admins can insert/update/delete)
CREATE POLICY "Everyone can view clothing items" ON clothing_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage clothing items" ON clothing_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Create policies for generated_images (users can view/manage their own)
CREATE POLICY "Users can view own generated images" ON generated_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own generated images" ON generated_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own generated images" ON generated_images FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own generated images" ON generated_images FOR DELETE USING (auth.uid() = user_id);

-- Create policies for user_favorites (users can manage their own favorites)
CREATE POLICY "Users can view own favorites" ON user_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own favorites" ON user_favorites FOR ALL USING (auth.uid() = user_id);
