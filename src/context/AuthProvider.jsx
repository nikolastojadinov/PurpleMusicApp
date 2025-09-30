import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [piSdkReady, setPiSdkReady] = useState(false);

  // 1. Inicijalizacija Pi Network SDK
  useEffect(() => {
    let initialized = false;
    async function initPiSdk() {
      try {
        if (window.Pi && !initialized) {
          await window.Pi.init({ version: '2.0', sandbox: false });
          initialized = true;
          setPiSdkReady(true);
        } else {
          // Dinamički učitaj SDK ako nije tu
          const script = document.createElement('script');
          script.src = 'https://sdk.minepi.com/pi-sdk.js';
          script.onload = async () => {
            if (window.Pi && !initialized) {
              await window.Pi.init({ version: '2.0', sandbox: false });
              initialized = true;
              setPiSdkReady(true);
            }
          };
          document.body.appendChild(script);
        }
      } catch (err) {
        console.error('Pi SDK init error:', err);
      }
    }
    initPiSdk();
  }, []);

  // 2. Login funkcija
  const loginWithPi = async () => {
    setLoading(true);
    try {
      if (!window.Pi) throw new Error('Pi Network SDK not loaded');
      await window.Pi.init({ version: '2.0', sandbox: false }); // osiguraj da je init
      const piAuth = await window.Pi.authenticate(['username', 'wallet_address']);
      const { user: piUser, accessToken } = piAuth;
      // Proveri Supabase user
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
      setUser(dbUser);
    } catch (err) {
      console.error('Pi login error:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 3. Auto login
  const autoLogin = async () => {
    setLoading(true);
    try {
      const savedToken = localStorage.getItem('pm_token');
      const savedUser = localStorage.getItem('pm_user');
      if (savedToken && savedUser) {
        setUser(JSON.parse(savedUser));
        setLoading(false);
        return;
      }
      setLoading(false);
    } catch (err) {
      console.error('Auto login error:', err);
      setUser(null);
      setLoading(false);
    }
  };

  // 4. Logout
  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('pm_token');
      localStorage.removeItem('pm_user');
      setUser(null);
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 5. Dohvati podatke korisnika
  const getUserData = () => user;

  useEffect(() => {
    autoLogin();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        piSdkReady,
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
