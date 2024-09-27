'use client'

import React from 'react';
import BadgeDisplay from '@/components/badges/BadgeDisplay';

interface Member {
  id: string;
  name: string;
  role: string;
  badges?: string[];
}

interface HouseholdMemberListProps {
  members: Member[];
}

const HouseholdMemberList: React.FC<HouseholdMemberListProps> = ({ members }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Household Members</h2>
      <ul className="space-y-4">
        {members.map((member) => (
          <li key={member.id} className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium">{member.name}</p>
              <p className="text-sm text-gray-500">{member.role}</p>
            </div>
            <div className="flex items-center space-x-2">
              {member.badges && member.badges.length > 0 && (
                <BadgeDisplay badges={member.badges} />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HouseholdMemberList;
