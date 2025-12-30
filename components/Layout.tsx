import React from 'react';
import { User, UserRole } from '../types';
import { Button } from './UI';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout, currentPage, onNavigate, children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white sticky top-0 z-50 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
              <span className="text-2xl font-bold text-brand-600">Vestiu<span className="text-gray-900">Bem</span></span>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <button
                    onClick={() => onNavigate('tryon')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${currentPage === '/tryon' ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:text-brand-600'}`}
                  >
                    Provador
                  </button>
                  <button
                    onClick={() => onNavigate('gallery')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${currentPage === '/gallery' ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:text-brand-600'}`}
                  >
                    Minha Galeria
                  </button>
                  {user.role === UserRole.ADMIN && (
                    <button
                      onClick={() => onNavigate('admin')}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${currentPage === '/admin' ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:text-brand-600'}`}
                    >
                      Admin
                    </button>
                  )}
                  <div className="h-6 w-px bg-gray-300 mx-2"></div>
                  <span className="text-sm text-gray-500 hidden sm:block">Olá, {user.name}</span>
                  <Button variant="secondary" onClick={onLogout} className="text-xs px-3 py-1">Sair</Button>
                </>
              ) : (
                <>
                {/* <a href="https://google.com" rel="noopener noreferrer">
                  Comprar
                </a> */}
                  <Button variant="outline" onClick={() => onNavigate('login')} className="text-xs sm:text-sm">Entrar</Button>
                  <Button variant="primary" onClick={() => onNavigate('register')} className="text-xs sm:text-sm">Criar Conta</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} VestiuBem. Powered by Agencia AI Magic.</p>
        </div>
      </footer>
    </div>
  );
};
