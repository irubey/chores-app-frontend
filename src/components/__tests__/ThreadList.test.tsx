import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders, mockThread } from "../../utils/test-utils";
import ThreadList from "../messages/ThreadList/ThreadList";
import { useHousehold } from "@/hooks/useHousehold";
import { Thread } from "@shared/types";

// Mock the useHousehold hook
jest.mock("@/hooks/useHousehold");

describe("ThreadList Component", () => {
  const mockHouseholds = [
    { id: "household-1", name: "Household 1" },
    { id: "household-2", name: "Household 2" },
  ];

  const mockThreads: Thread[] = [
    mockThread({
      id: "1",
      title: "Thread 1",
      householdId: "household-1",
      authorId: "user-1",
    }),
    mockThread({
      id: "2",
      title: "Thread 2",
      householdId: "household-2",
      authorId: "user-1",
    }),
  ];

  beforeEach(() => {
    // Setup default mock implementation
    (useHousehold as jest.Mock).mockReturnValue({
      selectedHouseholds: mockHouseholds,
      getSelectedHouseholds: jest.fn(),
      status: { list: "succeeded" },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render threads and household names", async () => {
    renderWithProviders(
      <ThreadList threads={mockThreads} selectedThreadId="1" />
    );

    // Check for household names in pills
    expect(screen.getByText("Household 1")).toBeInTheDocument();
    expect(screen.getByText("Household 2")).toBeInTheDocument();

    // Check for thread titles
    expect(screen.getByText("Thread 1")).toBeInTheDocument();
    expect(screen.getByText("Thread 2")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    (useHousehold as jest.Mock).mockReturnValue({
      selectedHouseholds: [],
      getSelectedHouseholds: jest.fn(),
      status: { list: "loading" },
    });

    renderWithProviders(
      <ThreadList threads={[]} selectedThreadId={undefined} />
    );

    expect(screen.getByRole("status")).toBeInTheDocument(); // Assuming Spinner has role="status"
  });

  it("should show empty state when no households are selected", () => {
    (useHousehold as jest.Mock).mockReturnValue({
      selectedHouseholds: [],
      getSelectedHouseholds: jest.fn(),
      status: { list: "succeeded" },
    });

    renderWithProviders(
      <ThreadList threads={[]} selectedThreadId={undefined} />
    );

    expect(screen.getByText("No households selected")).toBeInTheDocument();
    expect(
      screen.getByText("Select households in settings to view their threads")
    ).toBeInTheDocument();
  });

  it("should show empty threads state when households are selected but no threads exist", () => {
    (useHousehold as jest.Mock).mockReturnValue({
      selectedHouseholds: mockHouseholds,
      getSelectedHouseholds: jest.fn(),
      status: { list: "succeeded" },
    });

    renderWithProviders(
      <ThreadList threads={[]} selectedThreadId={undefined} />
    );

    expect(screen.getByText("No threads yet")).toBeInTheDocument();
  });

  it("should call getSelectedHouseholds on mount", () => {
    const getSelectedHouseholds = jest.fn();
    (useHousehold as jest.Mock).mockReturnValue({
      selectedHouseholds: mockHouseholds,
      getSelectedHouseholds,
      status: { list: "succeeded" },
    });

    renderWithProviders(
      <ThreadList threads={mockThreads} selectedThreadId={undefined} />
    );

    expect(getSelectedHouseholds).toHaveBeenCalledTimes(1);
  });
});
