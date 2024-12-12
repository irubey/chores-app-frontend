import { useHousehold, useAuth } from '../../hooks';

const CalendarHeader = () => {
  const { currentHousehold } = useHousehold();
  const { user } = useAuth();

  return (
    <header className="calendar-header">
      <h1>{currentHousehold ? `${currentHousehold.name} Calendar` : 'Shared Calendar'}</h1>
      <p>Welcome, {user?.name}</p>
    </header>
  );
};

export default CalendarHeader;