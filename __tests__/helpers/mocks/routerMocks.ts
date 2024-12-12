import { ReadonlyURLSearchParams } from "next/navigation";

export const mockRouter = {
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),

  // App Router specific
  route: "/",
  pathname: "/",
  asPath: "/",
  query: {},

  // Navigation events
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },

  // Search Params
  searchParams: new URLSearchParams() as ReadonlyURLSearchParams,

  // App Router Methods
  createHref: jest.fn(),
  createURL: jest.fn(),
  isFallback: false,
  isLocaleDomain: false,
  isPreview: false,
  isReady: true,
};

// Mock useRouter implementation
export function useRouter() {
  return mockRouter;
}

// Mock usePathname implementation
export function usePathname() {
  return mockRouter.pathname;
}

// Mock useSearchParams implementation
export function useSearchParams() {
  return mockRouter.searchParams;
}

// Mock useParams implementation
export function useParams() {
  return {};
}

// Helper to reset all mocks
export function resetRouterMocks() {
  mockRouter.back.mockReset();
  mockRouter.forward.mockReset();
  mockRouter.refresh.mockReset();
  mockRouter.push.mockReset();
  mockRouter.replace.mockReset();
  mockRouter.prefetch.mockReset();
  mockRouter.events.on.mockReset();
  mockRouter.events.off.mockReset();
  mockRouter.events.emit.mockReset();
  mockRouter.createHref.mockReset();
  mockRouter.createURL.mockReset();
}

// Helper to update router state
export function updateRouterState(newState: Partial<typeof mockRouter>) {
  Object.assign(mockRouter, newState);
}

// Mock next/navigation exports
jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockRouter.pathname,
  useSearchParams: () => mockRouter.searchParams,
  useParams: () => ({}),
}));
