'use client'

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';

const Header: React.FC = () => {
  const { theme, primaryColor, textColor } = useTheme();

  return (
    <header className={`bg-${primaryColor} shadow-md`}>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className={`text-2xl font-heading font-bold text-${textColor}`}>
          ChoresApp
        </Link>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link href="/household" className={`text-${textColor} hover:text-accent-light transition-colors duration-200`}>
                <Image src={`/icons/household-${theme}.svg`} alt="Household" width={24} height={24} />
              </Link>
            </li>
            <li>
              <Link href="/chores" className={`text-${textColor} hover:text-accent-light transition-colors duration-200`}>
                <Image src={`/icons/chores-${theme}.svg`} alt="Chores" width={24} height={24} />
              </Link>
            </li>
            <li>
              <Link href="/preferences" className={`text-${textColor} hover:text-accent-light transition-colors duration-200`}>
                <Image src={`/icons/preferences-${theme}.svg`} alt="Preferences" width={24} height={24} />
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
