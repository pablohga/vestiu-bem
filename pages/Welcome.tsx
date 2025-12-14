import React from 'react';
import { AuthPage } from './Login';
import { User } from '../types';

interface WelcomePageProps {
  onLogin: (user: User) => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onLogin }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
        <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
        Bem-vindo ao Vestiu Bem
      </h1>
      <p className="text-xl text-gray-600 max-w-2xl mb-10">
        Sua conta foi confirmada com sucesso! Agora você pode fazer login para começar a provar roupas virtualmente.
      </p>

      <div className="w-full max-w-md">
        <AuthPage
          mode="login"
          onSuccess={onLogin}
          onSwitchMode={() => {}}
        />
      </div>
    </div>
  );
};
