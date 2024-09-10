import React from 'react';
import HouseholdForm from '@/components/household/HouseholdForm';

export default function CreateHouseholdPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create or Join a Household</h1>
      <HouseholdForm />
    </div>
  );
}
