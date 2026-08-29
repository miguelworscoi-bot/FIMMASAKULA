import React, { useState, useEffect } from 'react';
import { AppFlowState, UserSession } from './types';
import { LoginModal } from './components/auth/LoginModal';
import { AppShell } from './components/layout/AppShell';
import { SplashOne } from './components/intro/SplashOne';

export function MasakulaSystem() {
  // Navigation State Machine
  const [flowState, setFlowState] = useState<AppFlowState>('SPLASH');

  useEffect(() => {
    setShowIntro(true);
  }, []);

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

  const handleSplashNext = () => {
    setFlowState('LOGIN');
  };

  const handleSkipToLogin = () => {
    setFlowState('LOGIN');
  };

  return (
    <div id="masakula-root-entry" className="min-h-screen bg-zinc-950 font-sans antialiased selection:bg-zinc-900 selection:text-white">
<<<<<<< HEAD
      {showIntro && (
        <div className="fixed inset-0 z-50 bg-black">
          <video
            autoPlay
            muted
            playsInline
            onEnded={() => setShowIntro(false)}
            className="h-full w-full object-cover object-center"
=======
      <AnimatePresence mode="wait">
        {flowState === 'SPLASH' && (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-screen w-full"
          >
            <SplashOne
              onNext={handleSplashNext}
              onSkipToLogin={handleSkipToLogin}
            />
          </motion.div>
        )}

        {flowState === 'LOGIN' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, filter: 'blur(4px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(4px)' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-screen w-full bg-[#f8f9fa]"
>>>>>>> e3182b4e6f8ae9827c771e504980528be85db8ed
          >
            <source src="/masakula-intro.mp4" type="video/mp4" />
          </video>
        </div>
      )}

      {flowState === 'LOGIN' && (
        <div className="min-h-screen w-full bg-[#f8f9fa]">
          <LoginModal onLoginSuccess={handleLoginSuccess} />
        </div>
      )}

      {flowState === 'APP_SHELL' && (
        <div className="min-h-screen w-full">
          <AppShell userSession={userSession} onLogout={handleLogout} />
        </div>
      )}
    </div>
  );
}

export default MasakulaSystem;
