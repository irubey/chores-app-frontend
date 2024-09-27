'use client'

import React, { useState } from 'react';
import { useHousehold } from '@/hooks/useHousehold';

interface InviteUserButtonProps {
  householdId: string;
}

const InviteUserButton: React.FC<InviteUserButtonProps> = ({ householdId }) => {
  const [email, setEmail] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { inviteMember } = useHousehold();

  const handleInvite = async () => {
    try {
      await inviteMember(householdId, email, 'MEMBER');
      setEmail('');
      setIsModalOpen(false);
      // You might want to show a success message here
    } catch (error) {
      console.error('Failed to invite member:', error);
      // You might want to show an error message here
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
      >
        Invite User
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">Invite User</h3>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full p-2 mb-4 border rounded"
            />
            <div className="flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InviteUserButton;
