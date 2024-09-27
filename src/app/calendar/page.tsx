'use client'
import React from 'react';
import { useSelector } from 'react-redux';
import { selectCalendar } from '../../store/slices/calendarSlice';
import SharedCalendar from '../../components/calendar/SharedCalendar';
import EventForm from '../../components/calendar/EventForm';
import AutomaticScheduler from '../../components/calendar/AutomaticScheduler';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useCalendar from '../../hooks/useCalendar';
import { RootState } from '../../store/store';

const CalendarPage: React.FC = () => {
  const { events, isLoading, isError, message } = useSelector(selectCalendar);
  const { fetchEvents, addEvent, updateEvent, deleteEvent } = useCalendar();
  const currentHousehold = useSelector((state: RootState) => state.household.currentHousehold);

  React.useEffect(() => {
    if (currentHousehold) {
      fetchEvents(currentHousehold.id);
    }
  }, [fetchEvents, currentHousehold]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <div className="text-red-500">Error: {message}</div>;
  }

  if (!currentHousehold) {
    return <div>Please select a household first.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Household Calendar</h1>
      <ErrorBoundary fallback={<div>Error: {message}</div>}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <SharedCalendar 
              events={events}
              onEventUpdate={(householdId, eventId, event) => updateEvent(householdId, eventId, event)}
              onEventDelete={(householdId, eventId) => deleteEvent(householdId, eventId)}
            />
          </div>
          <div>
            <EventForm 
              onSubmit={(householdId, event) => addEvent(householdId, event)}
              currentHouseholdId={currentHousehold.id}
            />
            <AutomaticScheduler />
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default CalendarPage;