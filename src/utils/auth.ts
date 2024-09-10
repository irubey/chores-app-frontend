const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const initiateOAuth = async (provider: 'GOOGLE' | 'FACEBOOK' | 'APPLE') => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ provider }),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to initiate OAuth');
  }
  return response.json();
};