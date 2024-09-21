export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  name: string;
  profileImageURL?: string;
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
  deviceTokens: string[];
  // Add other fields as necessary
}