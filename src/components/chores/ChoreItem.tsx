import React, { useState } from 'react';
import { Chore } from '../../utils/api';
import { useTheme } from '@/contexts/ThemeContext';
import { FaCheckCircle, FaEllipsisV } from 'react-icons/fa';
import Link from 'next/link';

interface ChoreItemProps {
  chore: Chore;
  onEdit: (chore: Chore) => void;
  onDelete: (choreId: string) => void;
  onComplete: (choreId: string) => void;
}

const ChoreItem: React.FC<ChoreItemProps> = ({ chore, onEdit, onDelete, onComplete }) => {
  const { theme, primaryColor, secondaryColor, accentColor } = useTheme();
  const [showOptions, setShowOptions] = useState(false);

  const truncateDescription = (description: string, maxLength: number) => {
    return description.length > maxLength
      ? `${description.substring(0, maxLength)}...`
      : description;
  };

  return (
    <li className={`card mb-4 hover:shadow-lg transition-shadow duration-300 ${theme === 'dark' ? 'bg-neutral-700' : 'bg-white'}`}>
      <Link href={`/chores/${chore.id}`} className="block">
        <div className="flex items-center justify-between p-4">
          <div className="flex-grow">
            <h3 className={`text-lg font-semibold mb-1 ${primaryColor}`}>{chore.title}</h3>
            <p className={`text-sm ${secondaryColor}`}>
              {truncateDescription(chore.description || '', 25)}
            </p>
          </div>
          <div className="flex items-center">
            <button
              onClick={(e) => {
                e.preventDefault();
                onComplete(chore.id);
              }}
              className={`mr-4 text-2xl ${chore.status === 'COMPLETED' ? accentColor : 'text-gray-400'} hover:${accentColor} transition-colors duration-200`}
            >
              <FaCheckCircle />
            </button>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setShowOptions(!showOptions);
                }}
                className={`text-xl ${secondaryColor} hover:${primaryColor} transition-colors duration-200`}
              >
                <FaEllipsisV />
              </button>
              {showOptions && (
                <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg ${theme === 'dark' ? 'bg-neutral-600' : 'bg-white'} ring-1 ring-black ring-opacity-5`}>
                  <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        onEdit(chore);
                        setShowOptions(false);
                      }}
                      className={`block px-4 py-2 text-sm ${primaryColor} hover:bg-gray-100 hover:text-gray-900 w-full text-left`}
                      role="menuitem"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        onDelete(chore.id);
                        setShowOptions(false);
                      }}
                      className={`block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 hover:text-red-900 w-full text-left`}
                      role="menuitem"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
};

export default ChoreItem;
