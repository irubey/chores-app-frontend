import React from 'react';
import { Select } from 'antd';
import { useCalendar } from '../../hooks';
import { EventCategory } from '../../types/event';

const EventFilter: React.FC = () => {
  const { events } = useCalendar();

  const handleChange = (value: EventCategory | 'ALL') => {
    // Implement filtering logic here
    if (value === 'ALL') {
      // Show all events
      console.log('Showing all events');
    } else {
      // Filter events by category
      const filteredEvents = events.filter(event => event.category === value);
      console.log('Filtered events:', filteredEvents);
    }
    // You might want to update the state in the parent component or in the Redux store
    // to actually filter the events shown in the calendar
  };

  return (
    <Select placeholder="Filter Events" onChange={handleChange} style={{ width: 200 }}>
      <Select.Option value="ALL">All</Select.Option>
      <Select.Option value={EventCategory.CHORE}>Chores</Select.Option>
      <Select.Option value={EventCategory.MEETING}>Meetings</Select.Option>
      <Select.Option value={EventCategory.SOCIAL}>Social</Select.Option>
      <Select.Option value={EventCategory.OTHER}>Other</Select.Option>
    </Select>
  );
};

export default EventFilter;