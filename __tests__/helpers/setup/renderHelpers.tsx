import {
  render,
  RenderOptions,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { Provider } from "react-redux";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SocketProvider } from "@/contexts/SocketContext";
import userEvent from "@testing-library/user-event";
import { createTestStore, TestStore } from "./testStore";
import { RootState } from "@/store/store";
import { getMockState } from "./mockData";
import { mockRouter } from "../mocks/routerMocks";
import { testLogger } from "../utils/testLogger";

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  preloadedState?: Partial<RootState>;
  store?: TestStore;
  router?: typeof mockRouter;
  theme?: "light" | "dark";
  withSocket?: boolean;
  currentUser?: {
    isAuthenticated: boolean;
    data: any;
  };
}

function customRender(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = createTestStore({ preloadedState }),
    router = mockRouter,
    theme = "light",
    withSocket = false,
    currentUser = { isAuthenticated: false, data: null },
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  testLogger.debug("Rendering component with custom configuration");

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <ThemeProvider defaultTheme={theme}>
          {withSocket ? (
            <SocketProvider
              isAuthenticated={currentUser.isAuthenticated}
              user={currentUser.data}
            >
              {children}
            </SocketProvider>
          ) : (
            children
          )}
        </ThemeProvider>
      </Provider>
    );
  }

  const testUser = userEvent.setup();

  return {
    store,
    user: testUser,
    router,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Re-export everything
export * from "@testing-library/react";

// Override render method
export { customRender as render };

// Common render patterns
export function renderWithStore(
  ui: React.ReactElement,
  state?: Partial<RootState>
) {
  return customRender(ui, { preloadedState: state });
}

export function renderWithRouter(
  ui: React.ReactElement,
  routerConfig?: Partial<typeof mockRouter>
) {
  return customRender(ui, { router: { ...mockRouter, ...routerConfig } });
}

export function renderWithTheme(
  ui: React.ReactElement,
  theme: "light" | "dark" = "light"
) {
  return customRender(ui, { theme });
}

export function renderWithSocket(
  ui: React.ReactElement,
  currentUser = { isAuthenticated: true, data: getMockState().auth.user }
) {
  return customRender(ui, { withSocket: true, currentUser });
}

export function renderWithAll(
  ui: React.ReactElement,
  options: Omit<CustomRenderOptions, "withSocket"> & {
    withSocket?: boolean;
  } = {}
) {
  return customRender(ui, { withSocket: true, ...options });
}

// Helper to wait for loading states
export async function waitForLoadingToFinish() {
  const { queryByTestId } = customRender(<div data-testid="loading-spinner" />);
  const spinner = queryByTestId("loading-spinner");
  if (spinner) {
    await waitForElementToBeRemoved(spinner);
  }
}

// Helper to simulate route changes
export async function navigateTo(path: string) {
  mockRouter.push(path);
  await waitFor(() => {
    expect(mockRouter.asPath).toBe(path);
  });
}
