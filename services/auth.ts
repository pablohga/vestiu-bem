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
import { supabase } from './supabase';

// Seed Admin & Default Catalog
// Helper: Converte HTTP para HTTPS
const ensureHttps = (url: string): string => {
  if (!url) return url;
  return url.replace(/^http:\/\//i, 'https://');
};

const seedData = async () => {
  try {
    const { data: users } = await getUsers();
    if (!users?.find(u => u.email === 'admin@vestiubem.com')) {
      await createUser({
        name: 'Administrador',
        email: 'admin@vestiubem.com',
        role: UserRole.ADMIN
      });
      console.log('Admin user seeded. Please set password in Supabase Auth.');
    }

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
          image_url: 'https://img.ltwebstatic.com/images3_pi/2021/12/20/16399677054f169992f584e030e46303287661074_thumbnail_600x.webp',
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
    console.log('🔐 Iniciando login para:', email);
    
    const { data, error } = await signIn(email, pass);
    
    if (error) {
      console.error('❌ Erro no signIn:', error);
      return null;
    }
    
    if (!data.user) {
      console.error('❌ Nenhum usuário retornado');
      return null;
    }

    console.log('✅ SignIn bem-sucedido. User ID:', data.user.id);
    
    const userId = data.user.id;

    // Busca o usuário na tabela 'users'
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('⚠️ Erro ao buscar usuário na tabela users:', userError);
      
      // Se o usuário não existe, cria automaticamente
      const name = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User';
      const userEmail = data.user.email || '';
      const role = userEmail === 'admin@vestiubem.com' ? UserRole.ADMIN : UserRole.USER;

      console.log('📝 Criando registro de usuário:', { name, email: userEmail, role });

      try {
        const newUser = await createUser({
          name,
          email: userEmail,
          role
        });

        console.log('✅ Usuário criado com sucesso:', newUser);

        return {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role as UserRole
        };
      } catch (createError) {
        console.error('❌ Erro ao criar usuário:', createError);
        return null;
      }
    }

    if (!userData) {
      console.error('❌ Dados do usuário não encontrados');
      return null;
    }

    console.log('✅ Usuário encontrado:', userData);

    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role as UserRole
    };
  } catch (error) {
    console.error('❌ Erro geral no login:', error);
    return null;
  }
};

export const register = async (name: string, email: string, pass: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('Attempting to sign up user:', { name, email });

    const { data, error } = await signUp(email, pass, name);
    console.log('SignUp response:', { data, error });

    if (error) {
      console.error('SignUp error:', error);
      throw error;
    }

    if (data.user) {
      console.log('User created successfully, awaiting confirmation:', data.user.id);
      
      localStorage.setItem('pendingUser', JSON.stringify({ name, email }));
      localStorage.setItem('awaitingConfirmation', 'true');

      if (data.session) {
        await signOut();
      }

      return { 
        success: true, 
        message: 'Email de confirmação enviado. Verifique seu email para continuar.' 
      };
    }

    throw new Error('Falha ao criar conta');
  } catch (error: any) {
    console.error('Registration error:', error);
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
  try {
    console.log('🔍 Buscando usuário atual...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Erro no auth.getUser:', authError);
      return null;
    }

    console.log('✅ Auth user encontrado:', user.id);

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error('⚠️ Usuário não encontrado na tabela users:', userError);
      
      // Cria o usuário automaticamente
      const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
      const email = user.email || '';
      const role = email === 'admin@vestiubem.com' ? UserRole.ADMIN : UserRole.USER;

      try {
        const newUser = await createUser({ name, email, role });
        console.log('✅ Usuário criado automaticamente:', newUser);
        
        return {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role as UserRole
        };
      } catch (createError) {
        console.error('❌ Erro ao criar usuário:', createError);
        return null;
      }
    }

    console.log('✅ Usuário completo:', userData);

    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role as UserRole
    };
  } catch (error) {
    console.error('❌ Erro em getCurrentUser:', error);
    return null;
  }
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
  await deleteUserSupabase(userId);
};

export const toggleFavorite = async (userId: string, item: ClothingItem): Promise<ClothingItem[]> => {
  const res = await toggleFavoriteSupabase(userId, item);
  const error = (res as any)?.error;
  const data = (res as any)?.data || [];
  
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
  
  // Converter todas as URLs HTTP para HTTPS
  return (data || []).map(item => ({
    ...item,
    image_url: ensureHttps(item.image_url),
    shein_link: ensureHttps(item.shein_link)
  }));
};

export const addClothingItem = async (item: Omit<ClothingItem, 'id'>): Promise<ClothingItem> => {
  const newItem = await createClothingItem({
    name: item.name,
    description: item.description,
    image_url: ensureHttps(item.image_url), // Garantir HTTPS
    price: item.price,
    shein_link: ensureHttps(item.shein_link) // Garantir HTTPS
  });
  
  return {
    id: newItem.id,
    name: newItem.name,
    description: newItem.description || undefined,
    image_url: ensureHttps(newItem.image_url),
    price: newItem.price,
    shein_link: ensureHttps(newItem.shein_link)
  };
};

export const deleteClothingItem = async (id: string) => {
  await deleteClothingItemSupabase(id);
};