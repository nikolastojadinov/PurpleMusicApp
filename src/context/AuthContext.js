import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

// Pi Network SDK loader
const loadPiSdk = () =>
  new Promise(resolve => {
    if (window.PiNetwork) return resolve(window.PiNetwork);
    const script = document.createElement('script');
    script.src = 'https://sdk.minepi.com/pi-sdk.js';
    script.onload = () => resolve(window.PiNetwork);
    document.body.appendChild(script);
  });

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pi login flow
  const loginWithPi = async () => {
    setLoading(true);
    try {
      const Pi = await loadPiSdk();
      const piAuth = await Pi.authenticate(['username', 'wallet_address']);
      const { user: piUser, accessToken } = piAuth;
      let { data: dbUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('pi_user_uid', piUser.uid)
        .single();
      if (!dbUser) {
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            pi_user_uid: piUser.uid,
            username: piUser.username,
            wallet_address: piUser.wallet_address,
          })
          .select('*')
          .single();
        if (insertError) throw insertError;
        dbUser = newUser;
      }
      localStorage.setItem('pm_token', accessToken);
      localStorage.setItem('pm_user', JSON.stringify(dbUser));
      setToken(accessToken);
      setUser(dbUser);
    } catch (err) {
      console.error('Pi login error:', err);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto login
  const autoLogin = async () => {
    setLoading(true);
    const savedToken = localStorage.getItem('pm_token');
    const savedUser = localStorage.getItem('pm_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setLoading(false);
      return;
    }
    await loginWithPi();
    setLoading(false);
  };

  // Logout
  const logout = async () => {
    setLoading(true);
    localStorage.removeItem('pm_token');
    localStorage.removeItem('pm_user');
    setToken(null);
    setUser(null);
    await supabase.auth.signOut();
    setLoading(false);
  };

  // Dohvati podatke korisnika
  const getUserData = () => user;

  useEffect(() => {
    autoLogin();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginWithPi,
        autoLogin,
        logout,
        getUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
