import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../utils/test-utils";
import ThreadList from "../messages/ThreadList/ThreadList";
import MessageList from "../messages/MessageList/MessageList";
import { useHousehold } from "@/hooks/useHousehold";
import { useMessages } from "@/hooks/useMessages";
import { HouseholdRole } from "@shared/enums";

// Mock all required hooks
jest.mock("@/hooks/useHousehold");
jest.mock("@/hooks/useMessages");
jest.mock("@/hooks/useAuth");
jest.mock("@/contexts/ThemeContext");

describe("Component Hierarchy", () => {
  // Common mock data
  const mockUser1 = {
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockHousehold = {
    id: "household-1",
    name: "Test Household",
    currency: "USD",
    timezone: "UTC",
    language: "en",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMembers = [
    {
      id: "member-1",
      householdId: "household-1",
      userId: mockUser1.id,
      role: HouseholdRole.ADMIN,
      isSelected: true,
      isInvited: false,
      isAccepted: true,
      isRejected: false,
      joinedAt: new Date(),
      user: mockUser1,
      household: mockHousehold,
    },
  ];

  const mockThreads = [
    {
      id: "thread-1",
      title: "Test Thread 1",
      householdId: "household-1",
      authorId: mockUser1.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockMessages = [
    {
      id: "msg-1",
      content: "Test message 1",
      threadId: "thread-1",
      authorId: mockUser1.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: mockUser1,
      thread: mockThreads[0],
      attachments: [],
      reactions: [],
      mentions: [],
      reads: [],
      poll: undefined,
    },
  ];

  beforeEach(() => {
    // Mock useHousehold hook
    (useHousehold as jest.Mock).mockReturnValue({
      selectedHouseholds: [mockHousehold],
      members: mockMembers,
      getSelectedHouseholds: jest.fn(),
      status: { list: "succeeded" },
    });

    // Mock useMessages hook
    (useMessages as jest.Mock).mockReturnValue({
      messages: mockMessages,
      threads: mockThreads,
      selectedThread: mockThreads[0],
      messageStatus: {
        list: "succeeded",
        create: "idle",
        update: "idle",
        delete: "idle",
        reaction: "idle",
        attachment: "idle",
        poll: "idle",
        mention: "idle",
        read: "idle",
      },
      threadStatus: {
        list: "succeeded",
        create: "idle",
        update: "idle",
        delete: "idle",
        invite: "idle",
        details: "idle",
      },
      getMessages: jest.fn(),
      startNewThread: jest.fn(),
    });
  });

  it("renders the complete message hierarchy", () => {
    renderWithProviders(
      <>
        <ThreadList threads={mockThreads} selectedThreadId="thread-1" />
        <MessageList
          messages={mockMessages}
          isLoading={false}
          currentUser={mockUser1}
        />
      </>
    );

    // Use more specific selectors
    expect(
      screen.getByRole("heading", { name: /Threads/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Test Thread 1")).toBeInTheDocument();
    expect(
      screen.getByText("Test Household", { selector: ".badge" })
    ).toBeInTheDocument();
    expect(screen.getByText("Test message 1")).toBeInTheDocument();
  });

  // Add more tests for other component combinations...
});
