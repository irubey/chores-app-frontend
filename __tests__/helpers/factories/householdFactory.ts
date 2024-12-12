import {
  Household,
  HouseholdMember,
  HouseholdWithMembers,
  HouseholdMemberWithUser,
  CreateHouseholdDTO,
  UpdateHouseholdDTO,
  AddMemberDTO,
} from "@shared/types";
import { HouseholdRole } from "@shared/enums";
import { generateId } from "../utils/idGenerator";
import { createMockUser } from "./userFactory";

// Types for factory options
interface CreateHouseholdOptions {
  withMembers?: boolean;
  memberCount?: number;
  withAdmin?: boolean;
  overrides?: Partial<Household>;
  memberOverrides?: Partial<HouseholdMember>;
}

interface CreateMemberOptions {
  isAdmin?: boolean;
  isInvited?: boolean;
  isAccepted?: boolean;
  isSelected?: boolean;
}

// Base Factories
export function createMockHousehold(
  overrides: Partial<Household> = {}
): Household {
  return {
    id: generateId("household"),
    name: "Test Household",
    currency: "USD",
    timezone: "UTC",
    language: "en",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockHouseholdMember(
  options: CreateMemberOptions = {},
  overrides: Partial<HouseholdMember> = {}
): HouseholdMember {
  const {
    isAdmin = false,
    isInvited = false,
    isAccepted = true,
    isSelected = true,
  } = options;

  return {
    id: generateId("member"),
    userId: generateId("user"),
    householdId: generateId("household"),
    role: isAdmin ? HouseholdRole.ADMIN : HouseholdRole.MEMBER,
    joinedAt: new Date(),
    isInvited,
    isAccepted,
    isRejected: false,
    isSelected,
    lastAssignedChoreAt: undefined,
    ...overrides,
  };
}

// Complex Factories
export function createMockHouseholdWithMembers(
  options: CreateHouseholdOptions = {}
): HouseholdWithMembers {
  const {
    memberCount = 2,
    withAdmin = true,
    overrides = {},
    memberOverrides = {},
  } = options;

  const household = createMockHousehold(overrides);

  const members = Array.from({ length: memberCount }, (_, index) =>
    createMockHouseholdMember(
      { isAdmin: withAdmin && index === 0 },
      { householdId: household.id, ...memberOverrides }
    )
  );

  return {
    ...household,
    members,
  };
}

export function createMockHouseholdMemberWithUser(
  options: CreateMemberOptions = {}
): HouseholdMemberWithUser {
  const user = createMockUser();
  const household = createMockHousehold();
  const member = createMockHouseholdMember(options, {
    userId: user.id,
    householdId: household.id,
  });

  return {
    ...member,
    user,
    household,
  };
}

// DTO Factories
export function createMockCreateHouseholdDTO(
  overrides: Partial<CreateHouseholdDTO> = {}
): CreateHouseholdDTO {
  return {
    name: "New Test Household",
    currency: "USD",
    timezone: "UTC",
    language: "en",
    ...overrides,
  };
}

export function createMockUpdateHouseholdDTO(
  overrides: Partial<UpdateHouseholdDTO> = {}
): UpdateHouseholdDTO {
  return {
    name: "Updated Household",
    currency: "EUR",
    timezone: "GMT",
    language: "es",
    ...overrides,
  };
}

export function createMockAddMemberDTO(
  overrides: Partial<AddMemberDTO> = {}
): AddMemberDTO {
  return {
    email: "test@example.com",
    role: HouseholdRole.MEMBER,
    ...overrides,
  };
}

// Batch Creation
export function createMockHouseholds(count: number): Household[] {
  return Array.from({ length: count }, (_, index) =>
    createMockHousehold({ id: generateId("household", index) })
  );
}

export function createMockHouseholdMembers(
  count: number,
  householdId: string
): HouseholdMember[] {
  return Array.from({ length: count }, (_, index) =>
    createMockHouseholdMember(
      { isAdmin: index === 0 },
      {
        id: generateId("member", index),
        householdId,
      }
    )
  );
}

// Test Scenario Helpers
export function createMockHouseholdWithInvites(
  inviteCount = 2
): HouseholdWithMembers {
  const household = createMockHousehold();
  const activeMembers = createMockHouseholdMembers(2, household.id);
  const invitedMembers = Array.from({ length: inviteCount }, () =>
    createMockHouseholdMember(
      {
        isInvited: true,
        isAccepted: false,
      },
      { householdId: household.id }
    )
  );

  return {
    ...household,
    members: [...activeMembers, ...invitedMembers],
  };
}

export function createMockHouseholdWithSelectedMembers(
  selectedCount = 2,
  totalCount = 4
): HouseholdWithMembers {
  const household = createMockHousehold();
  const members = Array.from({ length: totalCount }, (_, index) =>
    createMockHouseholdMember(
      {
        isSelected: index < selectedCount,
        isAdmin: index === 0,
      },
      { householdId: household.id }
    )
  );

  return {
    ...household,
    members,
  };
}
