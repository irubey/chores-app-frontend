import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { fetchUserHouseholds, setCurrentHousehold } from '../../store/slices/householdSlice';
import { Household, HouseholdMember } from '../../types/household';
import Button from '../common/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { User } from '../../types/user';

const HouseholdSelector: React.FC<{ user: User }> = ({ user }) => {
  const dispatch: AppDispatch = useDispatch();
  const { userHouseholds, currentHousehold, isLoading, isError } = useSelector((state: RootState) => state.household);
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUserHouseholds());
    }
  }, [dispatch, user?.id]);

  const handleHouseholdSelect = (householdId: string) => {
    const selectedHousehold = userHouseholds.find((h) => h.id === householdId);
    if (selectedHousehold) {
      dispatch(setCurrentHousehold(selectedHousehold));
    }
    setIsOpen(false);
  };

  const renderMemberStatus = (member: HouseholdMember) => {
    if (member.isInvited && !member.isAccepted && !member.isRejected) {
      return <span className="text-yellow-500">Invited</span>;
    }
    if (member.isAccepted) {
      return <span className="text-green-500">Member</span>;
    }
    if (member.isRejected) {
      return <span className="text-red-500">Rejected</span>;
    }
    return null;
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
        <ul
          className={`absolute z-10 w-full mt-1 border rounded-md shadow-lg ${
            theme === 'dark' ? 'bg-background-dark border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          {userHouseholds.map((household: Household) => (
            <li key={household.id}>
              <button
                onClick={() => handleHouseholdSelect(household.id)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                  theme === 'dark' ? 'hover:bg-gray-700' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{household.name}</span>
                  {household.members && (
                    <span className="text-sm text-gray-500">
                      {household.members.map((member) => (
                        <span key={member.id} className="ml-2">
                          {renderMemberStatus(member)}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HouseholdSelector;