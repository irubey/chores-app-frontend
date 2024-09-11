import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { api } from '@/utils/api';

interface Preferences {
  notification_preferences: {
    email: boolean;
    push: boolean;
  };
  chore_preferences: {
    preferred_chores: string[];
    disliked_chores: string[];
  };
  theme: Theme;
}

const PreferencesSection: React.FC = () => {
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const [preferences, setPreferences] = useState<Preferences>({
    notification_preferences: {
      email: true,
      push: true,
    },
    chore_preferences: {
      preferred_chores: [],
      disliked_chores: [],
    },
    theme: 'light',
  });

  const handleNotificationChange = (type: 'email' | 'push') => {
    setPreferences(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [type]: !prev.notification_preferences[type],
      },
    }));
  };

  const handleChorePreferenceChange = (chore: string, type: 'preferred' | 'disliked') => {
    setPreferences(prev => {
      const list = type === 'preferred' ? 'preferred_chores' : 'disliked_chores';
      const updatedList = prev.chore_preferences[list].includes(chore)
        ? prev.chore_preferences[list].filter(c => c !== chore)
        : [...prev.chore_preferences[list], chore];
      
      return {
        ...prev,
        chore_preferences: {
          ...prev.chore_preferences,
          [list]: updatedList,
        },
      };
    });
  };

  const handleThemeChange = (newTheme: string) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setPreferences(prev => ({ ...prev, theme: newTheme as Theme }));
      setTheme(newTheme as Theme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    } else {
      console.error('Invalid theme value');
    }
  };

  const savePreferences = async (prefsToSave = preferences) => {
    try {
      await api.put('/api/users/preferences', prefsToSave);
      console.log('Preferences saved:', prefsToSave);
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 shadow rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">Preferences</h2>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Notifications</h3>
        <label className="flex items-center mb-2">
          <input
            type="checkbox"
            checked={preferences.notification_preferences.email}
            onChange={() => handleNotificationChange('email')}
            className="mr-2"
          />
          Receive email notifications
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={preferences.notification_preferences.push}
            onChange={() => handleNotificationChange('push')}
            className="mr-2"
          />
          Receive push notifications
        </label>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Chore Preferences</h3>
        {/* Add UI for managing preferred and disliked chores */}
        {/* This could be a list of checkboxes or a more complex UI component */}
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Theme</h3>
        <select
          value={preferences.theme}
          onChange={(e) => handleThemeChange(e.target.value)}
          className="border rounded p-2"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <button
        onClick={(e) => {
          e.preventDefault();
          savePreferences();
        }}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Save Preferences
      </button>
    </div>
  );
};

export default PreferencesSection;
