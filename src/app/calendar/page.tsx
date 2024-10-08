"use client";
import React from "react";
import SharedCalendar from "../../components/calendar/SharedCalendar";
import ErrorBoundary from "../../components/common/ErrorBoundary";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useCalendar } from "../../hooks/useCalendar";
import { useHousehold } from "../../hooks/useHousehold";
import { Event } from "../../types/event";

const CalendarPage: React.FC = () => {
  const { getEvents, isLoading, isError, message } = useCalendar();
  const { currentHousehold } = useHousehold();

  React.useEffect(() => {
    if (currentHousehold) {
      getEvents(currentHousehold.id);
    }
  }, [getEvents, currentHousehold]);

  const handleEventClick = (event: Event) => {
    // Handle event click if needed
    console.log("Event clicked:", event);
  };

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
        <SharedCalendar onEventClick={handleEventClick} />
      </ErrorBoundary>
    </div>
  );
};

export default CalendarPage;
