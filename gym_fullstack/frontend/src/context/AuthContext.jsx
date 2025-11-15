import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refresh'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (refreshToken) {
      localStorage.setItem('refresh', refreshToken);
    } else {
      localStorage.removeItem('refresh');
    }
  }, [refreshToken]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = useCallback(async (email, password) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || 'Credenciales inválidas');
    }

    const data = await response.json();
    setToken(data.jwt);
    setRefreshToken(data.refresh);
    setUser(data.usuario);
    return data.usuario;
  }, []);

  const register = useCallback(async ({ nombre, apellido, email, password, phone }) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nombre, apellido, email, password, phone })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || 'No fue posible crear tu cuenta');
    }

    const data = await response.json();
    setToken(data.jwt);
    setRefreshToken(data.refresh);
    setUser(data.usuario);
    return data.usuario;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!refreshToken) {
      throw new Error('No hay refresh token disponible');
    }

    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh: refreshToken })
    });

    if (!response.ok) {
      logout();
      throw new Error('No se pudo refrescar el token');
    }

    const data = await response.json();
    setToken(data.access);
    return data.access;
  }, [refreshToken, logout]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        return;
      }

      const loadUser = async (currentToken) => {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${currentToken}`
          }
        });

        if (response.ok) {
          const profile = await response.json();
          setUser(profile);
          return true;
        }
        return false;
      };

      try {
        const loaded = await loadUser(token);
        if (!loaded && refreshToken) {
          const newToken = await refresh();
          if (newToken) {
            await loadUser(newToken);
          }
        }
      } catch (error) {
        console.error('No se pudo recuperar la sesión del usuario', error);
      }
    };

    if (token && !user) {
      fetchProfile();
    }
  }, [token, user, refreshToken, refresh]);

  const value = useMemo(
    () => ({ token, refreshToken, user, login, register, logout, refresh, apiBase: API_BASE, setUser }),
    [token, refreshToken, user, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
