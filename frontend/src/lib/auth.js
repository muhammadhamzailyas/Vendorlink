import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002/api';

const TOKEN_KEY = 'vl_token';

export const setToken = (token) => Cookies.set(TOKEN_KEY, token, { secure: true, sameSite: 'strict', expires: 7 });
export const getToken = () => Cookies.get(TOKEN_KEY);
export const removeToken = () => Cookies.remove(TOKEN_KEY);

export const registerUser = async (email, password, fullName) => {
  const res = await axios.post(`${API_BASE}/auth/register`, { email, password, fullName });
  return res.data;
};

export const loginUser = async (email, password) => {
  const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
  const { token, user } = res.data;
  setToken(token);
  return user;
};

export const loginWithGoogle = () => {
  // Redirect to backend Google OAuth initiation
  window.location.href = `${API_BASE}/auth/google`;
};

export const handleGoogleCallback = (token) => {
  // Called on the /auth/callback page with ?token= from query params
  setToken(token);
};

export const sendPasswordReset = async (email) => {
  const res = await axios.post(`${API_BASE}/auth/forgot-password`, { email });
  return res.data;
};

export const resetPassword = async (token, newPassword) => {
  const res = await axios.put(`${API_BASE}/auth/reset-password`, { token, newPassword });
  return res.data;
};

export const getAuthToken = () => getToken();
