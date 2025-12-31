import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { User, UserRole } from './types';
import { getCurrentUser, logout as logoutService } from './services/auth';
import { supabase, createUser } from './services/supabase';
import { Layout } from './components/Layout';
import { AuthPage } from './pages/Login';
import { WelcomePage } from './pages/Welcome';
import { TryOn } from './pages/TryOn';
import { Gallery } from './pages/Gallery';
import { SheinGallery } from './pages/SheinGallery';
import { AdminDashboard } from './pages/Admin';
import { PrivacyPage } from './pages/Privacy';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      console.log('loadUser')
      let currentUser: User | null = null;

      try {
        // Check if there's an active session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('🚀 App: Sessão ativa encontrada, carregando usuário...');
          currentUser = await getCurrentUser();
          console.log('📦 App: Usuário carregado:', currentUser);
        } else {
          console.log('ℹ️ App: Nenhuma sessão ativa');
          currentUser = null;
        }
      } catch (e) {
        console.error('❌ App: Erro ao carregar usuário:', e);
        currentUser = null;
      } finally {
        if (!mounted) return;

        setUser(currentUser);
        setLoading(false);

        // Check if awaiting confirmation
        const awaitingConfirmation = localStorage.getItem('awaitingConfirmation');
        if (awaitingConfirmation) {
          navigate('/welcome');
          return;
        }

        // Redirect logic if logged in
        if (currentUser) {
          console.log('✅ App: Usuário autenticado, redirecionando...');
          if (location.hash === '#admin' && currentUser.role === UserRole.ADMIN) {
            console.log('TEM QUE IR PARA ADMIN')
            navigate('/admin');
          } else {
            console.log('TEM QUE IR PARA TRYON')
            navigate('/tryon');
          }
        } else {
          console.log('ℹ️ App: Nenhum usuário autenticado');
          navigate('/');
        }
      }
    }

    loadUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('🔔 App: Auth state changed:', event, 'isLoggingIn:', isLoggingIn);

      // Se já está fazendo login manualmente, ignora o evento SIGNED_IN para evitar conflito
      if (event === 'SIGNED_IN' && session && isLoggingIn) {
        console.log('⏭️ App: Login manual em andamento, ignorando SIGNED_IN do listener');
        return;
      }

      if (event === 'SIGNED_IN' && session) {
        const awaitingConfirmation = localStorage.getItem('awaitingConfirmation');
        if (awaitingConfirmation) {
          // Create user record after confirmation
          const pendingUser = localStorage.getItem('pendingUser');
          if (pendingUser) {
            try {
              const { name, email } = JSON.parse(pendingUser);
              const { data: existingUser } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .maybeSingle();

              if (!existingUser) {
                await createUser({
                  name,
                  email,
                  role: UserRole.USER
                });
              }
            } catch (error) {
              console.error('Error creating user record:', error);
            }
          }

          localStorage.removeItem('awaitingConfirmation');
          localStorage.removeItem('pendingUser');
          navigate('/welcome');
          return;
        }

        // Normal login - apenas se não estiver fazendo login manual e se não há usuário já logado
        if (!isLoggingIn && !user) {
          console.log('🔐 App: Obtendo dados do usuário após SIGNED_IN...');
          try {
            const currentUser = await getCurrentUser();
            console.log('👤 App: Usuário obtido:', currentUser);

            if (currentUser) {
              setUser(currentUser);
              console.log('✅ App: Navegando para tryon');
              navigate('/tryon');
            } else {
              console.log('⚠️ App: Usuário nulo após login, indo para login');
              navigate('/login');
            }
          } catch (error) {
            console.error('❌ App: Erro ao obter usuário após SIGNED_IN:', error);
            navigate('/login');
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 App: Usuário deslogado');
        // Garante que flags de confirmação não vazem entre sessões
        localStorage.removeItem('awaitingConfirmation');
        localStorage.removeItem('pendingUser');
        setIsLoggingIn(false);
        setUser(null);
        navigate('/');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isLoggingIn]);

  const handleLogin = (u: User) => {
    console.log('🎯 App.handleLogin chamado com:', u);
    setIsLoggingIn(true);
    setUser(u);
    navigate('/tryon');
    // Reseta a flag após um pequeno delay para permitir que o listener processe
    setTimeout(() => setIsLoggingIn(false), 1000);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingIn(false);
      await logoutService();
    } catch (e) {
      console.error('Erro ao fazer logout:', e);
    } finally {
      // Limpa qualquer estado de confirmação pendente entre usuários
      localStorage.removeItem('awaitingConfirmation');
      localStorage.removeItem('pendingUser');
      setIsLoggingIn(false);
      setUser(null);
      navigate('/');
    }
  };

  const navigateTo = (page: string) => {
    console.log('🧭 App.navigate:', page);
    const pathMap: { [key: string]: string } = {
      home: '/',
      login: '/login',
      register: '/register',
      welcome: '/welcome',
      tryon: '/tryon',
      gallery: '/gallery',
      'shein-gallery': '/shein-gallery',
      admin: '/admin'
    };
    navigate(pathMap[page] || '/');
  };

  // Protected Route Component
  const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) => {
    if (!user) {
      return <AuthPage mode="login" onSuccess={handleLogin} onSwitchMode={() => navigateTo('register')} />;
    }
    if (adminOnly && user.role !== UserRole.ADMIN) {
      return <div className="text-center text-red-500">Acesso negado</div>;
    }
    return <>{children}</>;
  };

  // Landing Page Component
  const LandingPage = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
        Seu Provador Virtual Inteligente
      </h1>
      <p className="text-xl text-gray-600 max-w-2xl mb-10">
        Descubra como aquele look da Shein fica em você sem sair de casa.
        Venha provar roupas virtualmente.
      </p>
      <div className="flex gap-4">
        <button onClick={() => navigateTo('login')} className="px-8 py-4 bg-brand-600 text-white rounded-full text-lg font-bold shadow-lg hover:bg-brand-700 transition-transform hover:scale-105">
          Começar Agora
        </button>
        <button onClick={() => navigateTo('register')} className="px-8 py-4 bg-white text-brand-600 border-2 border-brand-100 rounded-full text-lg font-bold hover:bg-brand-50 transition-colors">
          Criar Conta
        </button>
      </div>
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-4xl mb-4">📸</div>
          <h3 className="text-lg font-bold mb-2">Envie sua Foto</h3>
          <p className="text-gray-500">Tire uma foto ou envie da galeria.</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-4xl mb-4">👗</div>
          <h3 className="text-lg font-bold mb-2">Escolha a Roupa</h3>
          <p className="text-gray-500">Selecione itens da Shein ou envie fotos de peças.</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-4xl mb-4">✨</div>
          <h3 className="text-lg font-bold mb-2">Veja a Mágica</h3>
          <p className="text-gray-500">Nossa IA veste você em segundos.</p>
        </div>
      </div>
    </div>
  );

  return (
    <Layout
      user={user}
      onLogout={handleLogout}
      currentPage={location.pathname}
      onNavigate={navigateTo}
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage mode="login" onSuccess={handleLogin} onSwitchMode={() => navigateTo('register')} />} />
        <Route path="/register" element={<AuthPage mode="register" onSuccess={handleLogin} onSwitchMode={() => navigateTo('login')} />} />
        <Route path="/welcome" element={<WelcomePage onLogin={handleLogin} />} />
        <Route path="/tryon" element={<ProtectedRoute><TryOn user={user!} onNavigate={navigateTo} /></ProtectedRoute>} />
        <Route path="/gallery" element={<ProtectedRoute><Gallery user={user!} /></ProtectedRoute>} />
        <Route path="/shein-gallery" element={<ProtectedRoute><SheinGallery /></ProtectedRoute>} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      </Routes>
    </Layout>
  );
}