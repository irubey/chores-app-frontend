import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { fetchHouseholds, setCurrentHousehold } from '../../store/slices/householdSlice';
import { Household } from '../../types/household';
import Button from '../common/Button';
import { useTheme } from '../../contexts/ThemeContext';

const HouseholdSelector: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { households, currentHousehold, isLoading, isError } = useSelector((state: RootState) => state.household);
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    dispatch(fetchHouseholds());
  }, [dispatch]);

  const handleHouseholdSelect = (householdId: string) => {
    const selectedHousehold = households.find(h => h.id === householdId);
    if (selectedHousehold) {
      dispatch(setCurrentHousehold(selectedHousehold));
    }
    setIsOpen(false);
  };

  if (isLoading) {
    return <div>Loading households...</div>;
  }

  if (isError) {
    return <div>Error loading households. Please try again.</div>;
  }

  return (
    <div className={`relative ${theme === 'dark' ? 'text-white' : 'text-text-primary'}`}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left ${theme === 'dark' ? 'bg-primary-dark' : 'bg-primary'} text-white px-4 py-2 rounded-md`}
      >
        {currentHousehold ? currentHousehold.name : 'Select a Household'}
      </Button>
      {isOpen && (
        <ul className={`absolute z-10 w-full mt-1 border rounded-md shadow-lg ${theme === 'dark' ? 'bg-background-dark border-gray-700' : 'bg-white border-gray-200'}`}>
          {households.map((household: Household) => (
            <li key={household.id}>
              <button
                onClick={() => handleHouseholdSelect(household.id)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${theme === 'dark' ? 'hover:bg-gray-700' : ''}`}
              >
                {household.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HouseholdSelector;