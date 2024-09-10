'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHousehold } from '@/hooks/useHousehold';

const HouseholdForm: React.FC = () => {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [householdId, setHouseholdId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { createHousehold, joinHousehold } = useHousehold();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (mode === 'create') {
        await createHousehold(name);
      } else {
        await joinHousehold(householdId);
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-4">
        <button
          className={`mr-2 px-4 py-2 rounded ${mode === 'create' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setMode('create')}
        >
          Create New
        </button>
        <button
          className={`px-4 py-2 rounded ${mode === 'join' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setMode('join')}
        >
          Join Existing
        </button>
      </div>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        {mode === 'create' ? (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Household Name
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="name"
              type="text"
              placeholder="Enter household name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="householdId">
              Household ID
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="householdId"
              type="text"
              placeholder="Enter household ID"
              value={householdId}
              onChange={(e) => setHouseholdId(e.target.value)}
              required
            />
          </div>
        )}
        {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
          >
            {mode === 'create' ? 'Create Household' : 'Join Household'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HouseholdForm;
