import { User, UserRole, GeneratedImage, ClothingItem } from '../types';
import {
  signUp,
  signIn,
  signOut,
  getCurrentUser as getCurrentUserSupabase,
  getUsers,
  createUser,
  deleteUser as deleteUserSupabase,
  getClothingItems as getClothingItemsSupabase,
  createClothingItem,
  deleteClothingItem as deleteClothingItemSupabase,
  getGeneratedImages,
  createGeneratedImage,
  getUserFavorites,
  toggleFavorite as toggleFavoriteSupabase
} from './supabase';

// Seed Admin & Default Catalog
const seedData = async () => {
  try {
    // Check if admin exists
    const { data: users } = await getUsers();
    if (!users?.find(u => u.email === 'admin@vestiubem.com')) {
      await createUser({
        name: 'Administrador',
        email: 'admin@vestiubem.com',
        role: UserRole.ADMIN
      });
      // Note: You'll need to set up the admin password through Supabase Auth dashboard
      console.log('Admin user seeded. Please set password in Supabase Auth.');
    }

    // Seed default catalog if empty
    const { data: catalog } = await getClothingItemsSupabase();
    if (!catalog || catalog.length === 0) {
      const defaultItems = [
        {
          name: 'Vestido Floral Verão',
          description: 'Leve e solto',
          image_url: 'https://img.ltwebstatic.com/images3_pi/2023/04/24/1682316086f685714364007874944d156555132a2c_thumbnail_600x.webp',
          price: 89.90,
          shein_link: '#'
        },
        {
          name: 'Blazer Casual Rosa',
          description: 'Elegância para o trabalho',
          image_url: 'https://img.ltwebstatic.com/images3_pi/2022/09/26/166415764028682705224e70195576722238426993_thumbnail_600x.webp',
          price: 129.90,
          shein_link: '#'
        },
        {
          name: 'Conjunto Top e Saia',
          description: 'Perfeito para festas',
          image_url: 'https://img.ltwebstatic.com/images3_pi/2021/12/20/16399677054f169992f584e030e463a03287661074_thumbnail_600x.webp',
          price: 159.90,
          shein_link: '#'
        }
      ];

      for (const item of defaultItems) {
        await createClothingItem(item);
      }
    }
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

seedData();

export const login = async (email: string, pass: string): Promise<User | null> => {
  try {
    const { data, error } = await signIn(email, pass);
    if (error) throw error;

    if (data.user) {
      return await getCurrentUser();
    }
    return null;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
};

export const register = async (name: string, email: string, pass: string): Promise<{ success: boolean; message: string }> => {
  try {
    const { data, error } = await signUp(email, pass, name);
    if (error) throw error;

    if (data.user) {
      // Store user data for later creation after confirmation
      localStorage.setItem('pendingUser', JSON.stringify({ name, email }));
      localStorage.setItem('awaitingConfirmation', 'true');

      return { success: true, message: 'Email de confirmação enviado. Verifique seu email para continuar.' };
    }
    throw new Error('Falha ao criar conta');
  } catch (error: any) {
    if (error.message.includes('already registered')) {
      throw new Error('Email já cadastrado.');
    }
    throw error;
  }
};

export const logout = async () => {
  await signOut();
};

export const getCurrentUser = async (): Promise<User | null> => {
  return await getCurrentUserSupabase();
};

// Data Access for Images and Favorites

export const saveGeneratedImage = async (image: Omit<GeneratedImage, 'id' | 'createdAt'>): Promise<GeneratedImage> => {
  const data = await createGeneratedImage({
    userId: image.userId,
    originalUserImage: image.originalUserImage,
    clothingImage: image.clothingImage,
    resultImage: image.resultImage,
    clothingName: image.clothingName
  });
  return {
    id: data.id,
    userId: data.user_id,
    originalUserImage: data.original_user_image,
    clothingImage: data.clothing_image,
    resultImage: data.result_image,
    createdAt: new Date(data.created_at).getTime(),
    clothingName: data.clothing_name || undefined
  };
};

export const getUserImages = async (userId: string): Promise<GeneratedImage[]> => {
  const { data } = await getGeneratedImages(userId);
  return data?.map(img => ({
    id: img.id,
    userId: img.user_id,
    originalUserImage: img.original_user_image,
    clothingImage: img.clothing_image,
    resultImage: img.result_image,
    createdAt: new Date(img.created_at).getTime(),
    clothingName: img.clothing_name || undefined
  })) || [];
};

export const getAllUsers = async (): Promise<User[]> => {
  const { data } = await getUsers();
  return data?.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as any
  })) || [];
};

export const deleteUser = async (userId: string) => {
  await deleteUser(userId);
};

export const toggleFavorite = async (userId: string, item: ClothingItem): Promise<ClothingItem[]> => {
  const res = await toggleFavoriteSupabase(userId, item);
  // Supabase responses typically have { data, error }
  // handle possible error shape and return mapped items
  // @ts-ignore
  const error = res?.error;
  // @ts-ignore
  const data = res?.data || [];
  if (error) throw error;
  return (data || []).map((d: any) => ({
    id: d.id,
    name: d.name,
    description: d.description || undefined,
    image_url: d.image_url,
    price: d.price,
    shein_link: d.shein_link
  }));
};

export const getFavorites = async (userId: string): Promise<ClothingItem[]> => {
  const { data } = await getUserFavorites(userId);
  return data || [];
};

// Catalog Management

export const getClothingItems = async (): Promise<ClothingItem[]> => {
  const { data, error } = await getClothingItemsSupabase();
  if (error) throw error;
  return data || [];
};

export const addClothingItem = async (item: Omit<ClothingItem, 'id'>): Promise<ClothingItem> => {
  const newItem = await createClothingItem({
    name: item.name,
    description: item.description,
    image_url: item.image_url,
    price: item.price,
    shein_link: item.shein_link
  });
  return {
    id: newItem.id,
    name: newItem.name,
    description: newItem.description || undefined,
    image_url: newItem.image_url,
    price: newItem.price,
    shein_link: newItem.shein_link
  };
};

export const deleteClothingItem = async (id: string) => {
  await deleteClothingItemSupabase(id);
};
