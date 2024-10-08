import React, { useEffect, useState } from "react";
import { useHousehold } from "../../hooks/useHousehold"; // Corrected import path
import { User } from "../../types/user";
import Button from "../common/Button";
import { useTheme } from "../../contexts/ThemeContext";
import { HouseholdMember } from "../../types/household";

const HouseholdSelector: React.FC<{ user: User }> = ({ user }) => {
  const {
    households, // Expected to be Household[]
    currentHousehold,
    isLoading,
    isError,
    fetchHouseholds,
    setCurrent,
  } = useHousehold();
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    console.log("Households:", households);
    console.log("User ID:", user?.id);
    console.log("Is Loading:", isLoading);

    if (user?.id && households && households.length === 0 && !isLoading) {
      fetchHouseholds();
    }
  }, [user?.id, fetchHouseholds, households, isLoading]);

  const handleHouseholdSelect = (householdId: string) => {
    const selectedHousehold = households.find((h) => h.id === householdId);
    if (selectedHousehold) {
      setCurrent(selectedHousehold);
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
    <div
      className={`relative ${
        theme === "dark" ? "text-white" : "text-text-primary"
      }`}
    >
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left ${
          theme === "dark" ? "bg-primary-dark" : "bg-primary"
        } text-white px-4 py-2 rounded-md`}
      >
        {currentHousehold ? currentHousehold.name : "Select a Household"}
      </Button>
      {isOpen && (
        <ul
          className={`absolute z-10 w-full mt-1 border rounded-md shadow-lg ${
            theme === "dark"
              ? "bg-background-dark border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          {households && households.length > 0 ? (
            households.map((household) => (
              <li key={household.id}>
                <button
                  onClick={() => handleHouseholdSelect(household.id)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                    theme === "dark" ? "hover:bg-gray-700" : ""
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{household.name}</span>
                    {household.members && household.members.length > 0 && (
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
            ))
          ) : (
            <li className="px-4 py-2 text-center text-gray-500">
              No households available.
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default HouseholdSelector;
