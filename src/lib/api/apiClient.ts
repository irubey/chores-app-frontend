import { AuthService } from "./services/authService";
import { UserService } from "./services/userService";
import { HouseholdService } from "./services/householdService";
import { ChoreService } from "./services/choreService";
import { CalendarService } from "./services/calendarService";
import { FinanceService } from "./services/financeService";
import { ThreadService } from "./services/threadService";
import { NotificationService } from "./services/notificationService";
import { setupInterceptors } from "./interceptors";

export class ApiClient {
  public readonly auth: AuthService;
  public readonly user: UserService;
  public readonly households: HouseholdService;
  public readonly chores: ChoreService;
  public readonly calendar: CalendarService;
  public readonly finances: FinanceService;
  public readonly threads: ThreadService;
  public readonly notifications: NotificationService;

  constructor() {
    // Initialize all services
    this.auth = new AuthService();
    this.user = new UserService();
    this.households = new HouseholdService();
    this.chores = new ChoreService();
    this.calendar = new CalendarService();
    this.finances = new FinanceService();
    this.threads = new ThreadService();
    this.notifications = new NotificationService();
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();
