// ==================================================
// FILE: src/components/LoginModal.jsx
// ==================================================

import { useState, useEffect, useCallback } from 'react';
import { GOOGLE_CLIENT_ID } from '../utils';

export const LoginModal = ({ onClose, onLogin, darkMode = true }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const googleButtonRef = useCallback((node) => {
    if (node && window.google?.accounts?.id) {
      window.google.accounts.id.renderButton(node, {
        theme: darkMode ? 'filled_black' : 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
        shape: 'rectangular',
      });
    }
  }, [darkMode]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
        });
        const btnContainer = document.getElementById('google-signin-btn');
        if (btnContainer) {
          window.google.accounts.id.renderButton(btnContainer, {
            theme: darkMode ? 'filled_black' : 'outline',
            size: 'large',
            width: 320,
            text: 'continue_with',
            shape: 'rectangular',
          });
        }
      }
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [darkMode]);

  const handleCredentialResponse = (response) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const user = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      };
      localStorage.setItem('oversold_user', JSON.stringify(user));
      onLogin(user);
      onClose();
    } catch (err) {
      setError('Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  const isConfigured = GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

  return (
    <div
      className={`fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${
        darkMode ? 'bg-black/90' : 'bg-black/50'
      }`}
      onClick={onClose}
    >
      <div
        className={`rounded-2xl p-8 max-w-md w-full shadow-2xl border ${
          darkMode 
            ? 'bg-[#1a1a24] border-white/10' 
            : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-8">
          <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Sign in to Oversold
          </h2>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Create a watchlist to track your favorite assets
          </p>
        </div>
        {!isConfigured ? (
          <div className={`rounded-xl p-4 mb-4 ${
            darkMode 
              ? 'bg-yellow-500/10 border border-yellow-500/30' 
              : 'bg-yellow-50 border border-yellow-300'
          }`}>
            <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
              ⚠️ Setup Required
            </p>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              To enable Google Sign-In, configure your GOOGLE_CLIENT_ID.
            </p>
          </div>
        ) : (
          <>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div id="google-signin-btn" ref={googleButtonRef} className="flex justify-center" />
            )}
            {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
          </>
        )}
        <p className={`text-center text-sm mt-6 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          By signing in, you agree to our{' '}
          <a href="#/terms" className="text-orange-400 hover:underline">
            Terms of Service
          </a>
        </p>
        <button
          onClick={onClose}
          className={`w-full mt-4 py-2 transition-colors text-sm ${
            darkMode 
              ? 'text-gray-400 hover:text-white' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
