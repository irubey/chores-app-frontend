import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const initiateOAuth = async (provider: 'GOOGLE' | 'FACEBOOK' | 'APPLE') => {
  const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { provider });
  return response.data;
};