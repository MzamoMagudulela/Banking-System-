import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { translations } from '../utils/translations';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  language: 'en' | 'zu';
  t: typeof translations.en;
  setLanguage: (lang: 'en' | 'zu') => void;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('smartbank_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('smartbank_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [language, setLanguageState] = useState<'en' | 'zu'>(() => {
    return (localStorage.getItem('smartbank_lang') as 'en' | 'zu') || 'en';
  });

  const setLanguage = (lang: 'en' | 'zu') => {
    setLanguageState(lang);
    localStorage.setItem('smartbank_lang', lang);
    if (user) {
      api.updateProfile({ preferred_language: lang }).catch(() => {});
    }
  };

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('smartbank_token', newToken);
    localStorage.setItem('smartbank_user', JSON.stringify(newUser));
    if (newUser.preferred_language) {
      setLanguageState(newUser.preferred_language);
      localStorage.setItem('smartbank_lang', newUser.preferred_language);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.logout();
      }
    } catch (e) {
      // Continue client cleanup even if network fails
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('smartbank_token');
      localStorage.removeItem('smartbank_user');
      window.location.href = '/login';
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const freshUser = await api.getMe();
      setUser(freshUser);
      localStorage.setItem('smartbank_user', JSON.stringify(freshUser));
      if (freshUser.preferred_language) {
        setLanguageState(freshUser.preferred_language);
      }
    } catch (e) {
      console.error('Failed to refresh user profile:', e);
    }
  };

  useEffect(() => {
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const t = translations[language] || translations.en;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        language,
        t,
        setLanguage,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
