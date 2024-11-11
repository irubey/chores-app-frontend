import React from "react";
import { screen } from "@testing-library/react";
import {
  renderWithProviders,
  mockThread,
  mockUser,
} from "../../utils/test-utils";
import ThreadList from "../messages/ThreadList/ThreadList";
import { useHousehold } from "@/hooks/useHousehold";
import { useMessages } from "@/hooks/useMessages";
import {
  HouseholdMemberWithUser,
  Household,
  MessageWithDetails,
} from "@shared/types";
import { HouseholdRole } from "@shared/enums";

jest.mock("@/hooks/useHousehold");
jest.mock("@/hooks/useMessages");

describe("ThreadList", () => {
  const mockUser1 = mockUser({ id: "user-1" });
  const mockUser2 = mockUser({ id: "user-2", name: "Test User 2" });

  const mockThread1 = mockThread({
    id: "thread-1",
    title: "Test Thread 1",
    messages: [
      {
        id: "msg-1",
        content: "Test message 1",
        threadId: "thread-1",
        authorId: mockUser1.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: mockUser1,
        thread: {
          id: "thread-1",
          title: "Test Thread 1",
          householdId: "household-1",
          authorId: mockUser1.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        attachments: [],
        reactions: [],
        mentions: [],
        reads: [],
        poll: undefined,
      },
    ],
  });

  const mockThread2 = mockThread({
    id: "thread-2",
    title: "Test Thread 2",
    messages: [],
  });

  const mockThreads = [mockThread1, mockThread2];

  const mockHousehold: Household = {
    id: "household-1",
    name: "Test Household",
    currency: "USD",
    timezone: "UTC",
    language: "en",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMembers: HouseholdMemberWithUser[] = [
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
    {
      id: "member-2",
      householdId: "household-1",
      userId: mockUser2.id,
      role: HouseholdRole.MEMBER,
      isSelected: true,
      isInvited: false,
      isAccepted: true,
      isRejected: false,
      joinedAt: new Date(),
      user: mockUser2,
      household: mockHousehold,
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
      thread: mockThread1,
      attachments: [],
      reactions: [],
      mentions: [],
      reads: [],
      poll: undefined,
    },
  ];

  const mockHouseholdHook = {
    households: [mockHousehold],
    currentHousehold: mockHousehold,
    members: mockMembers,
    selectedHouseholds: [mockHousehold],
    selectedMembers: mockMembers,
    status: {
      list: "succeeded" as const,
      create: "idle" as const,
      update: "idle" as const,
      delete: "idle" as const,
      member: "idle" as const,
      invitation: "idle" as const,
    },
    error: null,
    fetchHouseholds: jest.fn(),
    fetchHouseholdDetails: jest.fn(),
    createNewHousehold: jest.fn(),
    updateHouseholdDetails: jest.fn(),
    removeHousehold: jest.fn(),
    fetchMembers: jest.fn(),
    inviteMember: jest.fn(),
    removeMember: jest.fn(),
    updateMemberRole: jest.fn(),
    getSelectedHouseholds: jest.fn(),
    toggleHouseholdSelection: jest.fn(),
    sendInvitation: jest.fn(),
    updateInvitationStatus: jest.fn(),
    getInvitations: jest.fn(),
    setCurrent: jest.fn(),
    resetHouseholdState: jest.fn(),
    addMember: jest.fn(),
  };

  const mockMessagesHook = {
    messages: mockMessages,
    threads: mockThreads,
    selectedThread: mockThread1,
    messageStatus: {
      list: "succeeded" as const,
      create: "idle" as const,
      update: "idle" as const,
      delete: "idle" as const,
      reaction: "idle" as const,
      attachment: "idle" as const,
      poll: "idle" as const,
      mention: "idle" as const,
      read: "idle" as const,
    },
    threadStatus: {
      list: "succeeded" as const,
      create: "idle" as const,
      update: "idle" as const,
      delete: "idle" as const,
      invite: "idle" as const,
      details: "idle" as const,
    },
    messageError: null,
    threadError: null,
    hasMore: false,
    nextCursor: undefined,
    getMessages: jest.fn(),
    startNewThread: jest.fn(),
    getThreadDetails: jest.fn(),
    editThread: jest.fn(),
    removeThread: jest.fn(),
    inviteUsers: jest.fn(),
    selectThreadById: jest.fn(),
    reset: jest.fn(),
    sendMessage: jest.fn(),
    editMessage: jest.fn(),
    removeMessage: jest.fn(),
    addMessageReaction: jest.fn(),
    removeMessageReaction: jest.fn(),
    addMessageAttachment: jest.fn(),
    removeMessageAttachment: jest.fn(),
    createMessagePoll: jest.fn(),
    updateMessagePoll: jest.fn(),
    voteOnPoll: jest.fn(),
    removeVoteFromPoll: jest.fn(),
    markAsRead: jest.fn(),
    createMessageMention: jest.fn(),
    deleteMessageMention: jest.fn(),
  };

  beforeEach(() => {
    (useHousehold as jest.Mock).mockReturnValue(mockHouseholdHook);
    (useMessages as jest.Mock).mockReturnValue(mockMessagesHook);
  });

  it("renders thread list correctly", () => {
    renderWithProviders(
      <ThreadList threads={mockThreads} selectedThreadId="thread-1" />
    );
    expect(
      screen.getByRole("heading", { name: /Threads/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Test Thread 1")).toBeInTheDocument();
    expect(screen.getByText("Test Thread 2")).toBeInTheDocument();
  });

  it("displays selected households", () => {
    renderWithProviders(
      <ThreadList threads={mockThreads} selectedThreadId="thread-1" />
    );
    expect(
      screen.getByText(mockHousehold.name, {
        selector: ".badge",
      })
    ).toBeInTheDocument();
  });

  it("calls getSelectedHouseholds on mount", () => {
    renderWithProviders(
      <ThreadList threads={mockThreads} selectedThreadId="thread-1" />
    );
    expect(mockHouseholdHook.getSelectedHouseholds).toHaveBeenCalled();
  });

  it("renders new thread modal button", () => {
    renderWithProviders(
      <ThreadList threads={mockThreads} selectedThreadId="thread-1" />
    );
    expect(
      screen.getByRole("button", { name: /New Thread/i })
    ).toBeInTheDocument();
  });

  it("shows selected thread with correct styling", () => {
    renderWithProviders(
      <ThreadList threads={mockThreads} selectedThreadId="thread-1" />
    );
    const selectedThread = screen
      .getByText("Test Thread 1")
      .closest("[data-testid='thread-item']");
    expect(selectedThread).toHaveClass("bg-neutral-100 dark:bg-neutral-800");
  });

  it("shows empty state when no threads exist", () => {
    renderWithProviders(
      <ThreadList threads={[]} selectedThreadId={undefined} />
    );
    expect(screen.getByText("No threads yet")).toBeInTheDocument();
  });

  it("shows loading state when fetching threads", () => {
    const loadingHouseholdHook = {
      ...mockHouseholdHook,
      status: {
        ...mockHouseholdHook.status,
        list: "loading" as const,
      },
    };
    (useHousehold as jest.Mock).mockReturnValue(loadingHouseholdHook);

    renderWithProviders(
      <ThreadList threads={[]} selectedThreadId={undefined} />
    );

    // Update to use data-testid instead of role
    expect(screen.getByTestId("thread-list-loading")).toBeInTheDocument();
  });
});
