import React, { useState, useEffect } from 'react';
import { Button, Input, Card, LoadingSpinner } from '../components/UI';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('handleSubmit', currentMode, { name, email, password });
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (currentMode === 'login') {
        const user = await login(email, password);
        if (user) {
          console.log(user)
          onSuccess(user);
          console.log('SUCESSO')
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
          setName('');
          setEmail('');
          setPassword('');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentMode === 'confirmation') {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="w-full max-w-md p-8 shadow-xl border-brand-100">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Cadastro Realizado</h1>
            <p className="text-gray-600 mb-2">
              {confirmationMessage}
            </p>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-800">
                Após confirmar seu email, você será redirecionado para a tela de boas-vindas onde poderá fazer login.
              </p>
            </div>
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

          <Button 
            type="submit" 
            className="w-full mt-4 py-3 text-lg flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner />
                {currentMode === 'login' ? 'Entrando...' : 'Cadastrando...'}
              </>
            ) : (
              currentMode === 'login' ? 'Entrar' : 'Cadastrar'
            )}
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
              <p className="font-bold">Duvidas ou sugestões:</p>
              <p>Email: admin@vestiubem.com</p>
           </div>
        )}
      </Card>
    </div>
  );
};
