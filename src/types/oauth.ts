export interface OAuthIntegration {
  id: string;
  userId: string;
  provider: 'GOOGLE' | 'FACEBOOK' | 'APPLE';
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string; // ISO string format
  // Add other fields as necessary
}