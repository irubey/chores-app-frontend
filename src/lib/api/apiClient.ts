import { ChoreService } from "./services/choreService";
import { CalendarService } from "./services/calendarService";
import { FinanceService } from "./services/financeService";
import { NotificationService } from "./services/notificationService";

export class ApiClient {
  public readonly chores: ChoreService;
  public readonly calendar: CalendarService;
  public readonly finances: FinanceService;
  public readonly notifications: NotificationService;

  constructor() {
    // Initialize all services

    this.calendar = new CalendarService();
    this.finances = new FinanceService();
    this.notifications = new NotificationService();
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();
