import React, { useState, useEffect } from 'react';
import { Button, Input, Card } from '../components/UI';
import { login, register } from '../services/auth';
import { User } from '../types';

interface AuthPageProps {
  mode: 'login' | 'register';
  onSuccess: (user: User) => void;
  onSwitchMode: (mode: 'login' | 'register') => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ mode, onSuccess, onSwitchMode }) => {
  const [currentMode, setCurrentMode] = useState<'login' | 'register' | 'confirmation'>(mode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (currentMode === 'login') {
        const user = await login(email, password);
        if (user) {
          onSuccess(user);
        } else {
          setError('Email ou senha inválidos');
        }
      } else if (currentMode === 'register') {
        if (!name || !email || !password) {
          setError('Preencha todos os campos');
          return;
        }
        const result = await register(name, email, password);
        if (result.success) {
          setConfirmationMessage(result.message);
          setCurrentMode('confirmation');
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (currentMode === 'confirmation') {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="w-full max-w-md p-8 shadow-xl border-brand-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Confirmação Enviada</h1>
            <p className="text-gray-500 mt-2">
              {confirmationMessage}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Card className="w-full max-w-md p-8 shadow-xl border-brand-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{currentMode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}</h1>
          <p className="text-gray-500 mt-2">
            {currentMode === 'login' ? 'Faça login para acessar o provador virtual' : 'Registre-se para começar a vestir bem'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {currentMode === 'register' && (
            <Input
              label="Nome Completo"
              placeholder="Maria Silva"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          )}

          <Input
            label="Email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <Input
            label="Senha"
            type="password"
            placeholder="******"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full mt-4 py-3 text-lg">
            {currentMode === 'login' ? 'Entrar' : 'Cadastrar'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">
            {currentMode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
          </span>
          <button
            onClick={() => onSwitchMode(currentMode === 'login' ? 'register' : 'login')}
            className="ml-2 font-medium text-brand-600 hover:text-brand-500"
          >
            {currentMode === 'login' ? 'Registre-se' : 'Faça Login'}
          </button>
        </div>

        {currentMode === 'login' && (
           <div className="mt-4 p-4 bg-gray-50 rounded text-xs text-gray-500 border border-gray-200">
             <p className="font-bold">Acesso Admin Demo:</p>
             <p>Email: admin@vestiubem.com</p>
             <p>Senha: admin</p>
           </div>
        )}
      </Card>
    </div>
  );
};
