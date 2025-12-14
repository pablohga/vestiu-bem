import React from 'react';
import { AuthPage } from './Login';
import { User } from '../types';

interface WelcomePageProps {
  onLogin: (user: User) => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onLogin }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-purple-600">
        Bem-vindo ao Vestiu Bem!
      </h1>
      <p className="text-xl text-gray-600 max-w-2xl mb-10">
        Sua conta foi confirmada com sucesso. Agora você pode fazer login para começar a provar roupas virtualmente.
      </p>

      <div className="w-full max-w-md">
        <AuthPage
          mode="login"
          onSuccess={onLogin}
          onSwitchMode={() => {}} // No switching needed here
        />
      </div>
    </div>
  );
};
