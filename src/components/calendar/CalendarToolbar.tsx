import { Button } from 'antd';
import { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';

const CalendarToolbar = ({ calendarRef }) => {
  const handleToday = () => {
    calendarRef.current.getApi().today();
  };

  const handleNext = () => {
    calendarRef.current.getApi().next();
  };

  const handlePrev = () => {
    calendarRef.current.getApi().prev();
  };

  return (
    <div className="calendar-toolbar">
      <Button onClick={handlePrev}>Previous</Button>
      <Button onClick={handleToday}>Today</Button>
      <Button onClick={handleNext}>Next</Button>
      {/* Additional toolbar buttons can be added here */}
    </div>
  );
};

export default CalendarToolbar;