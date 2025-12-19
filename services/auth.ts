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

/* export const login = async (email: string, pass: string): Promise<User | null> => {
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
}; */

export const login = async (email: string, pass: string): Promise<User | null> => {
  try {
    console.log('🔐 Iniciando login para:', email);
    
    // 1. Autenticação no Supabase
    const { data: authData, error: authError } = await signIn(email, pass);
    
    if (authError) {
      console.error('❌ Erro na autenticação:', authError.message);
      throw new Error(authError.message || 'Falha ao autenticar');
    }
    
    if (!authData?.user) {
      console.error('❌ Nenhum usuário retornado da autenticação');
      throw new Error('Usuário não encontrado na autenticação');
    }

    const userId = authData.user.id;
    console.log('✅ Autenticação bem-sucedida. User ID:', userId);

    const buildFallbackUser = (): User => {
      const name = authData.user.user_metadata?.name 
        || authData.user.email?.split('@')[0] 
        || 'User';
      
      const userEmail = authData.user.email || email;
      const role = userEmail.toLowerCase() === 'admin@vestiubem.com' 
        ? UserRole.ADMIN 
        : UserRole.USER;

      return {
        id: userId,
        name,
        email: userEmail,
        role
      };
    };

    // 2. Buscar usuário no banco de dados
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', userId)
      .maybeSingle();

    // 3. Se usuário existe, retornar dados
    if (!userError && userData) {
      console.log('✅ Usuário encontrado na base de dados:', userData.email);
      return {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: (userData.role as UserRole) || UserRole.USER
      };
    }

    // 4. Se usuário não existe, criar registro
    console.log('📝 Criando novo registro de usuário...');
    
    try {
      const newUser = await createUser({
        name: buildFallbackUser().name,
        email: buildFallbackUser().email,
        role: buildFallbackUser().role
      });

      console.log('✅ Usuário criado com sucesso:', newUser.email);

      return {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: (newUser.role as UserRole) || UserRole.USER
      };
    } catch (createError) {
      console.error('❌ Erro ao criar usuário, usando fallback:', createError);
      
      // Último recurso: usar os dados do auth para manter o fluxo
      return buildFallbackUser();
    }

  } catch (error: any) {
    console.error('❌ Erro geral no login:', error);
    throw new Error(error.message || 'Erro ao realizar login');
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
  try {
    console.log('🚪 Fazendo logout...');
    const { error } = await signOut();
    if (error) {
      console.error('❌ Erro ao fazer logout:', error);
      throw error;
    }
    console.log('✅ Logout realizado com sucesso');
  } catch (error) {
    console.error('❌ Erro no logout:', error);
    // Mesmo com erro, tenta limpar a sessão localmente
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.error('❌ Erro ao limpar sessão local:', e);
    }
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    console.log('🔍 Buscando usuário atual...');
    
    // Adiciona timeout para evitar travamento infinito
    const getUserPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout ao buscar usuário')), 10000)
    );
    
    const { data: { user }, error: authError } = await Promise.race([
      getUserPromise,
      timeoutPromise
    ]) as any;
    
    if (authError || !user) {
      console.error('❌ Erro no auth.getUser:', authError);
      return null;
    }

    const buildFallbackUser = (): User => {
      const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
      const email = user.email || '';
      const role = email.toLowerCase() === 'admin@vestiubem.com' ? UserRole.ADMIN : UserRole.USER;

      return {
        id: user.id,
        name,
        email,
        role
      };
    };

    console.log('✅ Auth user encontrado:', user.id);

    // Query com timeout também
    const queryPromise = supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    const queryTimeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout na query de usuário')), 10000)
    );

    let userData, userError;
    try {
      const result = await Promise.race([queryPromise, queryTimeoutPromise]) as any;
      userData = result.data;
      userError = result.error;
    } catch (queryError: any) {
      console.warn('⚠️ Erro ou timeout na query de usuário:', queryError);
      userError = queryError;
      userData = null;
      // On timeout, use fallback user to avoid null return
      if (queryError.message.includes('Timeout')) {
        console.log('⏰ Timeout na query, usando dados do auth como fallback');
        return buildFallbackUser();
      }
    }

    if (userError || !userData) {
      console.warn('⚠️ Usuário não encontrado na tabela users, tentando criar...', userError);
      
      // Verifica se o erro é de usuário já existente (duplicação)
      const isDuplicateError = userError?.code === '23505' || 
                               userError?.message?.includes('duplicate') ||
                               userError?.message?.includes('already exists');
      
      if (isDuplicateError) {
        console.log('ℹ️ Usuário já existe, buscando novamente...');
        // Se já existe, tenta buscar novamente
        const { data: retryData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (retryData) {
          console.log('✅ Usuário encontrado após retry:', retryData);
          return {
            id: retryData.id,
            name: retryData.name,
            email: retryData.email,
            role: (retryData.role as UserRole) || UserRole.USER
          };
        }
      }
      
      // Tenta criar apenas se não for erro de duplicação
      if (!isDuplicateError) {
        try {
          const newUser = await createUser({ 
            name: buildFallbackUser().name, 
            email: buildFallbackUser().email, 
            role: buildFallbackUser().role 
          });
          console.log('✅ Usuário criado automaticamente:', newUser);
          
          return {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: (newUser.role as UserRole) || UserRole.USER
          };
        } catch (createError: any) {
          // Se erro de duplicação ao criar, busca o usuário existente
          if (createError?.code === '23505' || createError?.message?.includes('duplicate')) {
            console.log('ℹ️ Usuário já existe, buscando...');
            const { data: existingData } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();
            
            if (existingData) {
              return {
                id: existingData.id,
                name: existingData.name,
                email: existingData.email,
                role: (existingData.role as UserRole) || UserRole.USER
              };
            }
          }
          console.error('❌ Erro ao criar usuário, usando fallback:', createError);
          return buildFallbackUser();
        }
      } else {
        // Se é erro de duplicação mas não encontrou, usa fallback
        console.warn('⚠️ Erro de duplicação mas usuário não encontrado, usando fallback');
        return buildFallbackUser();
      }
    }

    console.log('✅ Usuário completo:', userData);

    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: (userData.role as UserRole) || UserRole.USER
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