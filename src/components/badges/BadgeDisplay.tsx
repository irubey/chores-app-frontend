import React from 'react';

interface BadgeDisplayProps {
  badges: string[];
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ badges }) => {
  return (
    <div className="flex space-x-1">
      {badges.map((badge, index) => (
        <span
          key={index}
          className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
        >
          {badge}
        </span>
      ))}
    </div>
  );
};

export default BadgeDisplay;
