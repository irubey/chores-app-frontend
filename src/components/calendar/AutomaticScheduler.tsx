'use client'
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { scheduleChores } from '../../store/slices/calendarSlice';
import { AppDispatch, RootState } from '../../store/store';

const AutomaticScheduler: React.FC = () => {
  const [isScheduling, setIsScheduling] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const currentHousehold = useSelector((state: RootState) => state.household.currentHousehold);

  const handleSchedule = async () => {
    if (!currentHousehold) {
      console.error('No household selected');
      return;
    }

    setIsScheduling(true);
    try {
      await dispatch(scheduleChores(currentHousehold.id));
      // Show success message
    } catch (error) {
      // Show error message
      console.error('Failed to schedule chores:', error);
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="mt-6 bg-white shadow-md rounded px-8 pt-6 pb-8">
      <h2 className="text-xl font-bold mb-4">Automatic Chore Scheduler</h2>
      <p className="mb-4">Automatically schedule rotating chores on the calendar.</p>
      <button
        onClick={handleSchedule}
        disabled={isScheduling || !currentHousehold}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        {isScheduling ? 'Scheduling...' : 'Schedule Chores'}
      </button>
    </div>
  );
};

export default AutomaticScheduler;