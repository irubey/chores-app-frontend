import {
  User,
  UpdateUserDTO,
  RegisterUserDTO,
  LoginCredentials,
} from "@shared/types";
import { generateId } from "../utils/idGenerator";

// Factory Options Types
interface CreateUserOptions {
  isAuthenticated?: boolean;
  withProfile?: boolean;
}

interface CreateCredentialsOptions {
  withValidPassword?: boolean;
}

// Base Factories
export function createMockUser(
  options: CreateUserOptions = {},
  overrides: Partial<User> = {}
): User {
  const { withProfile = false } = options;

  return {
    id: generateId("user"),
    name: "Test User",
    email: "test@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    profileImageURL: withProfile
      ? "https://example.com/profile.jpg"
      : undefined,
    ...overrides,
  };
}

// DTO Factories
export function createMockRegisterDTO(
  overrides: Partial<RegisterUserDTO> = {}
): RegisterUserDTO {
  return {
    email: "newuser@example.com",
    password: "Password123!",
    name: "New Test User",
    ...overrides,
  };
}

export function createMockLoginCredentials(
  options: CreateCredentialsOptions = {},
  overrides: Partial<LoginCredentials> = {}
): LoginCredentials {
  const { withValidPassword = true } = options;

  return {
    email: "test@example.com",
    password: withValidPassword ? "ValidPassword123!" : "invalid",
    ...overrides,
  };
}

export function createMockUpdateUserDTO(
  overrides: Partial<UpdateUserDTO> = {}
): UpdateUserDTO {
  return {
    name: "Updated Test User",
    profileImageURL: "https://example.com/updated-profile.jpg",
    ...overrides,
  };
}

// Batch Creation
export function createMockUsers(
  count: number,
  options: CreateUserOptions = {},
  overrides: Partial<User> = {}
): User[] {
  return Array.from({ length: count }, (_, index) =>
    createMockUser(options, {
      id: generateId("user", index + 1),
      email: `test${index + 1}@example.com`,
      ...overrides,
    })
  );
}

// Test Scenario Helpers
export function createMockAuthenticatedUser(): User {
  return createMockUser(
    { withProfile: true },
    {
      name: "Authenticated User",
      email: "authenticated@example.com",
    }
  );
}

export function createMockInvalidCredentials(): LoginCredentials {
  return createMockLoginCredentials({ withValidPassword: false });
}

export function createMockUserWithProfile(): User {
  return createMockUser(
    { withProfile: true },
    {
      name: "User With Profile",
      email: "profile@example.com",
    }
  );
}

// Auth Flow Helpers
export function createMockRegistrationFlow() {
  const registerDTO = createMockRegisterDTO();
  const createdUser = createMockUser(
    {},
    {
      email: registerDTO.email,
      name: registerDTO.name,
    }
  );

  return {
    registerDTO,
    createdUser,
  };
}

export function createMockLoginFlow(success = true) {
  const credentials = createMockLoginCredentials({
    withValidPassword: success,
  });
  const user = success ? createMockAuthenticatedUser() : undefined;

  return {
    credentials,
    user,
  };
}

export function createMockProfileUpdateFlow() {
  const originalUser = createMockUserWithProfile();
  const updateDTO = createMockUpdateUserDTO();
  const updatedUser = {
    ...originalUser,
    ...updateDTO,
    updatedAt: new Date(),
  };

  return {
    originalUser,
    updateDTO,
    updatedUser,
  };
}
