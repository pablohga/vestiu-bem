import React, { useState, useEffect } from 'react';
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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Simple router state
  const [currentPage, setCurrentPage] = useState('home'); // home, login, register, tryon, gallery, admin

  useEffect(() => {
    let mounted = true;
    async function loadUser() {
      let currentUser: User | null = null;
      try {
        currentUser = await getCurrentUser();
      } catch (e) {
        currentUser = null;
      } finally {
        if (!mounted) return;
        setUser(currentUser);
        setLoading(false);

        // Check if awaiting confirmation
        const awaitingConfirmation = localStorage.getItem('awaitingConfirmation');
        if (awaitingConfirmation) {
          setCurrentPage('welcome');
          return;
        }

        // Redirect logic if logged in
        if (currentUser) {
            if (window.location.hash === '#admin' && currentUser.role === UserRole.ADMIN) {
              setCurrentPage('admin');
            } else {
              setCurrentPage('tryon');
            }
        } else {
          setCurrentPage('home');
        }
      }
    }

    loadUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

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
          setCurrentPage('welcome');
          return;
        }

        // Normal login
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
          setCurrentPage('tryon');
        } else {
          setCurrentPage('login');
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentPage('home');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    setCurrentPage('tryon');
  };

  const handleLogout = () => {
    logoutService();
    setUser(null);
    setCurrentPage('home');
  };

  const navigate = (page: string) => {
    setCurrentPage(page);
  };

/*   if (loading) return <div className="flex h-screen items-center justify-center">Carregando...</div>;
 */
  // Page Routing Logic
  let pageContent;

  if (!user) {
    if (currentPage === 'welcome') {
      pageContent = <WelcomePage onLogin={handleLogin} />;
    } else if (currentPage === 'register') {
      pageContent = <AuthPage mode="register" onSuccess={handleLogin} onSwitchMode={() => navigate('login')} />;
    } else if (currentPage === 'login') {
      pageContent = <AuthPage mode="login" onSuccess={handleLogin} onSwitchMode={() => navigate('register')} />;
    } else {
      // Landing Page
      pageContent = (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
              Seu Provador Virtual Inteligente
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mb-10">
              Descubra como aquele look da Shein fica em você sem sair de casa.
              Venha provar roupas virtualmente.
            </p>
            <div className="flex gap-4">
              <button onClick={() => navigate('login')} className="px-8 py-4 bg-brand-600 text-white rounded-full text-lg font-bold shadow-lg hover:bg-brand-700 transition-transform hover:scale-105">
                Começar Agora
              </button>
              <button onClick={() => navigate('register')} className="px-8 py-4 bg-white text-brand-600 border-2 border-brand-100 rounded-full text-lg font-bold hover:bg-brand-50 transition-colors">
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
    }
  } else {
    // Authenticated Routes
    switch (currentPage) {
      case 'admin':
        pageContent = user.role === UserRole.ADMIN ? <AdminDashboard /> : <div className="text-center text-red-500">Acesso negado</div>;
        break;
      case 'gallery':
        pageContent = <Gallery user={user} />;
        break;
      case 'shein-gallery':
        pageContent = <SheinGallery />;
        break;
      case 'tryon':
      default:
        pageContent = <TryOn user={user} onNavigate={navigate} />;
        break;
    }
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      currentPage={currentPage} 
      onNavigate={navigate}
    >
      {pageContent}
    </Layout>
  );
}
