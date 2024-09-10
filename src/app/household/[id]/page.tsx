'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useHousehold, Household } from '@/hooks/useHousehold';
import HouseholdMemberList from '@/components/household/HouseholdMemberList';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import InviteUserButton from '@/components/household/InviteUserButton';

export default function HouseholdDetailsPage() {
  const { id } = useParams();
  const { fetchHouseholdById, isLoading } = useHousehold();
  const [household, setHousehold] = useState<Household | null>(null);

  useEffect(() => {
    const loadHousehold = async () => {
      if (id) {
        const fetchedHousehold = await fetchHouseholdById(id as string);
        setHousehold(fetchedHousehold);
      }
    };
    loadHousehold();
  }, [id, fetchHouseholdById]);

  if (isLoading) return <LoadingSpinner />;

  if (!household) return <div>Household not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{household.name}</h1>
      <div className="mb-6">
        <InviteUserButton householdId={household.id} />
      </div>
      <HouseholdMemberList members={household.members} />
    </div>
  );
}
