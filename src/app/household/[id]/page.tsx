'use client';

import React, { useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useHousehold } from '@/hooks/useHousehold';
import HouseholdMemberList from '@/components/household/HouseholdMemberList';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import InviteUserButton from '@/components/household/InviteUserButton';
import { useAuth } from '@/hooks/useAuth';
import HouseholdSelector from '@/components/household/HouseholdSelector';

export default function HouseholdDetailsPage() {
  const { id } = useParams();
  const { fetchHouseholdById, currentHousehold, setCurrentHousehold, isLoading, deleteHousehold, leaveHousehold, households } = useHousehold();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (households.length === 0) {
      router.push('/household/create');
    }
    else if (households.length > 1) {
      router.push(`/household/${households[0].id}`);
    }
  }, [households, router]);

  const loadHousehold = useCallback(async () => {
    if (id && (!currentHousehold || currentHousehold.id !== id)) {
      const existingHousehold = households.find(h => h.id === id);
      if (existingHousehold) {
        setCurrentHousehold(existingHousehold);
      } else {
        try {
          const fetchedHousehold = await fetchHouseholdById(id as string);
          if (fetchedHousehold) {
            setCurrentHousehold(fetchedHousehold);
          } else {
            // User is not associated with this household
            if (households.length > 0) {
              // Redirect to the first household they are a member of
              router.push(`/household/${households[0].id}`);
            } else {
              // User is not a member of any household
              router.push('/household/create');
            }
          }
        } catch (error) {
          console.error('Error fetching household:', error);
          // Handle the error (e.g., show an error message)
        }
      }
    }
  }, [id, currentHousehold, fetchHouseholdById, setCurrentHousehold, households, router]);

  useEffect(() => {
    loadHousehold();
  }, [loadHousehold]);

  if (isLoading) return <LoadingSpinner />;

  if (!currentHousehold) return null; // We'll handle redirection in loadHousehold

  const handleDeleteHousehold = async () => {
    if (currentHousehold) {
      try {
        await deleteHousehold(currentHousehold.id);
        router.push('/dashboard');
      } catch (error) {
        console.error('Error deleting household:', error);
        // Handle error (e.g., show an error message to the user)
      }
    }
  };

  const handleLeaveHousehold = async () => {
    if (currentHousehold) {
      try {
        await leaveHousehold(currentHousehold.id);
        router.push('/dashboard');
      } catch (error) {
        console.error('Error leaving household:', error);
        // Handle error (e.g., show an error message to the user)
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <HouseholdSelector />
      <h1 className="text-3xl font-bold mb-6">{currentHousehold.name}</h1>
      <div className="mb-6">
        <InviteUserButton householdId={currentHousehold.id} />
        {currentHousehold.members && user && (
          currentHousehold.members.find(member => member.id === user.id)?.role === 'ADMIN' ? (
            <button onClick={handleDeleteHousehold} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 ml-2">
              Delete Household
            </button>
          ) : (
            <button onClick={handleLeaveHousehold} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 ml-2">
              Leave Household
            </button>
          )
        )}
      </div>
      {currentHousehold.members && (
        <HouseholdMemberList members={currentHousehold.members} />
      )}
    </div>
  );
}
