import { screen } from "@testing-library/react";
import {
  renderWithProviders,
  mockMessage,
  mockUser,
} from "../../utils/test-utils";
import MessageList from "../messages/MessageList/MessageList";
import { useMessages } from "@/hooks/useMessages";

jest.mock("@/hooks/useMessages");

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe("MessageList", () => {
  const mockMessages = [
    mockMessage({ id: "msg-1" }),
    mockMessage({ id: "msg-2" }),
  ];
  const testUser = mockUser();

  const mockStatus = {
    list: "succeeded",
    create: "idle",
    update: "idle",
    delete: "idle",
    reaction: "idle",
    attachment: "idle",
    poll: "idle",
    mention: "idle",
    read: "idle",
  } as const;

  beforeEach(() => {
    (useMessages as jest.Mock).mockReturnValue({
      messages: mockMessages,
      status: mockStatus,
      hasMore: false,
      getMessages: jest.fn(),
    });
  });

  it("renders messages correctly", () => {
    renderWithProviders(
      <MessageList
        messages={mockMessages}
        isLoading={false}
        currentUser={testUser}
      />,
      {
        preloadedState: {
          messages: {
            messages: mockMessages,
            selectedMessage: null,
            status: mockStatus,
            error: null,
            hasMore: false,
            nextCursor: undefined,
          },
        },
      }
    );
    const messageElement = screen.getByText(mockMessages[0].content, {
      selector: ".prose:not(.ml-8)",
    });
    expect(messageElement).toBeInTheDocument();
  });
});
