import React from 'react';
import { useHousehold } from '@/hooks/useHousehold';
import Link from 'next/link';

const HouseholdSelector: React.FC = () => {
  const { households, currentHousehold, isLoading } = useHousehold();

  if (isLoading) {
    return <div>Loading households...</div>;
  }

  if (!households || households.length === 0) {
    return <div>You are not a member of any households.</div>;
  }

  return (
    <div className="flex flex-wrap gap-4 mb-4">
      {households.map((household) => (
        <Link
          key={household.id}
          href={`/household/${household.id}`}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            currentHousehold?.id === household.id
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {household.name}
        </Link>
      ))}
    </div>
  );
};

export default HouseholdSelector;
