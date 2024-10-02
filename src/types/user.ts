export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  name: string;
  profileImageURL?: string;
  createdAt: string; 
  updatedAt: string; 
  deviceTokens: string[];
  role: 'ADMIN' | 'MEMBER';
}