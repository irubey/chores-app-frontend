export interface User {
  id: string;
  email: string;
  name: string;
  profileImageURL?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserDTO {
  name?: string;
  profileImageURL?: string;
}
