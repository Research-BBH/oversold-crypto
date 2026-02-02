// ==================================================
// FILE: src/components/LoginModal.jsx
// ==================================================

import { useState, useEffect, useCallback } from 'react';
import { GOOGLE_CLIENT_ID } from '../utils';

export const LoginModal = ({ onClose, onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const googleButtonRef = useCallback((node) => {
    if (node && window.google?.accounts?.id) {
      window.google.accounts.id.renderButton(node, {
        theme: 'filled_black',
        size: 'large',
        width: 320,
        text: 'continue_with',
        shape: 'rectangular',
      });
    }
  }, []);

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
            theme: 'filled_black',
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
  }, []);

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
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a24] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Sign in to Oversold</h2>
          <p className="text-gray-400">Create a watchlist to track your favorite assets</p>
        </div>
        {!isConfigured ? (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
            <p className="text-yellow-400 text-sm font-medium mb-2">⚠️ Setup Required</p>
            <p className="text-gray-400 text-xs">
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
        <p className="text-center text-gray-500 text-sm mt-6">
          By signing in, you agree to our{' '}
          <a href="#/terms" className="text-orange-400 hover:underline">
            Terms of Service
          </a>
        </p>
        <button
          onClick={onClose}
          className="w-full mt-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
