import { createClient } from '@supabase/supabase-js';
import { Database } from '../types';

// Remove custom ImportMetaEnv and ImportMeta interfaces.
// TypeScript already provides the correct global type for import.meta.env.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth functions
export const signUp = async (email: string, password: string, name: string) => {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name,
      }
    }
  });
};

export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password
  });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get additional user data from users table
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!userData) return null;

  return {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    role: userData.role as any
  };
};

// User management
export const getUsers = async () => {
  return await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
};

export const createUser = async (userData: { name: string; email: string; role: string }) => {
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteUser = async (userId: string) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) throw error;
};

// Clothing items
export const getClothingItems = async () => {
  return await supabase
    .from('clothing_items')
    .select('*')
    .order('created_at', { ascending: false });
};

export const createClothingItem = async (item: {
  name: string;
  description?: string;
  image_url: string;
  price: number;
  shein_link: string;
}) => {
  const { data, error } = await supabase
    .from('clothing_items')
    .insert([item])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteClothingItem = async (itemId: string) => {
  const { error } = await supabase
    .from('clothing_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
};

// Generated images
export const getGeneratedImages = async (userId: string) => {
  return await supabase
    .from('generated_images')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
};

export const createGeneratedImage = async (image: {
  userId: string;
  originalUserImage: string;
  clothingImage: string;
  resultImage: string;
  clothingName?: string;
}) => {
  const { data, error } = await supabase
    .from('generated_images')
    .insert([{
      user_id: image.userId,
      original_user_image: image.originalUserImage,
      clothing_image: image.clothingImage,
      result_image: image.resultImage,
      clothing_name: image.clothingName
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// User favorites
export const getUserFavorites = async (userId: string) => {
  return await supabase
    .from('user_favorites')
    .select(`
      *,
      clothing_items (*)
    `)
    .eq('user_id', userId);
};

export const toggleFavorite = async (userId: string, item: any) => {
  // Check if favorite exists
  const { data: existing } = await supabase
    .from('user_favorites')
    .select('*')
    .eq('user_id', userId)
    .eq('clothing_item_id', item.id)
    .single();

  if (existing) {
    // Remove favorite
    await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('clothing_item_id', item.id);
  } else {
    // Add favorite
    await supabase
      .from('user_favorites')
      .insert([{
        user_id: userId,
        clothing_item_id: item.id
      }]);
  }

  // Return updated favorites
  return await getUserFavorites(userId);
};
