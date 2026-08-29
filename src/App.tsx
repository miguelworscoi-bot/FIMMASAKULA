import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppFlowState, UserSession } from './types';
import { LoginModal } from './components/auth/LoginModal';
import { AppShell } from './components/layout/AppShell';

export function MasakulaSystem() {
  // Navigation State Machine
  const [flowState, setFlowState] = useState<AppFlowState>('LOGIN');

  // Authenticated User Session
  const [userSession, setUserSession] = useState<UserSession>(() => {
    try {
      const saved = localStorage.getItem('masakula_user_session_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return {
      email: 'miguelworscoi@gmail.com',
      name: 'Miguel Worscoi',
      role: 'Administrador Master',
      terminalId: 'Caixa 01 - Balcão Principal',
      isLoggedIn: false,
    };
  });

  // Save session state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('masakula_user_session_v1', JSON.stringify(userSession));
    } catch (e) {
      console.warn(e);
    }
  }, [userSession]);

  // State Machine Handlers
  const handleLoginSuccess = (session: UserSession) => {
    setUserSession(session);
    setFlowState('APP_SHELL');
  };

  const handleLogout = () => {
    setUserSession(prev => ({ ...prev, isLoggedIn: false }));
    setFlowState('LOGIN');
  };

  return (
    <div id="masakula-root-entry" className="min-h-screen bg-zinc-950 font-sans antialiased selection:bg-zinc-900 selection:text-white">
      <AnimatePresence mode="wait">
        {flowState === 'LOGIN' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.28 }}
            className="min-h-screen w-full bg-[#f8f9fa]"
          >
            <LoginModal
              onLoginSuccess={handleLoginSuccess}
            />
          </motion.div>
        )}

        {flowState === 'APP_SHELL' && (
          <motion.div
            key="app_shell"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen w-full"
          >
            <AppShell
              userSession={userSession}
              onLogout={handleLogout}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MasakulaSystem;
