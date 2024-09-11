import React from 'react';
import { useHousehold } from '@/hooks/useHousehold';
import Link from 'next/link';

const HouseholdSection: React.FC = () => {
  const { households, isLoading, error } = useHousehold();

  if (isLoading) {
    return <div>Loading households...</div>;
  }

  if (error) {
    return <div>Error loading households: {error}</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Your Households</h2>
      {households.length === 0 ? (
        <p>You are not a member of any households yet.</p>
      ) : (
        <ul className="space-y-4">
          {households.map((household) => (
            <li key={household.id} className="border-b pb-2">
              <Link href={`/household/${household.id}`} className="text-blue-600 hover:underline">
                {household.name}
              </Link>
              <p className="text-sm text-gray-600">
                Members: {household.members.length}
              </p>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4">
        <Link href="/household/create" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Create New Household
        </Link>
      </div>
    </div>
  );
};

export default HouseholdSection;

