import { createClient } from '@supabase/supabase-js';
import { Database } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth functions
export const signUp = async (email: string, password: string, name: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name
      }
    }
  });
  
  return { data, error };
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

  if (!userData) {
    // User record doesn't exist, create it
    const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
    const email = user.email || '';
    const role = email === 'admin@vestiubem.com' ? 'admin' : 'user';

    try {
      const newUser = await createUser({
        name,
        email,
        role
      });
      
      return {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role as any
      };
    } catch (error) {
      console.error('Error creating user record:', error);
      return null;
    }
  }

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
  // Pega o ID do usuário autenticado atual
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Nenhum usuário autenticado para criar registro');
  }

  console.log('📝 Criando usuário na tabela users com ID:', user.id);

  const { data, error } = await supabase
    .from('users')
    .insert([{
      id: user.id,  // IMPORTANTE: Usa o mesmo ID do auth.users
      name: userData.name,
      email: userData.email,
      role: userData.role
    }])
    .select()
    .single();
  
  if (error) {
    console.error('❌ Erro ao inserir na tabela users:', error);
    throw error;
  }
  
  console.log('✅ Usuário inserido com sucesso:', data);
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