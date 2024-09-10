import { useState, useCallback } from 'react';
import { useHousehold } from './useHousehold';
import { api } from '../utils/api';

export interface ChoreTemplate {
  id: string;
  title: string;
  description: string;
  timeEstimate: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
}

export const useChoreTemplates = () => {
  const [templates, setTemplates] = useState<ChoreTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentHousehold } = useHousehold();

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedTemplates = await api.get('/api/chore-templates');
      setTemplates(fetchedTemplates);
      setError(null);
    } catch (err) {
      setError('Failed to fetch chore templates');
      console.error('Error fetching chore templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createChoreTemplate = async (templateData: Omit<ChoreTemplate, 'id'>) => {
    if (!currentHousehold) return;
    setIsLoading(true);
    try {
      const newTemplate = await api.post(`/api/households/${currentHousehold.id}/chore-templates`, templateData);
      setTemplates([...templates, newTemplate]);
      setError(null);
    } catch (err) {
      setError('Failed to create chore template');
      console.error('Error creating chore template:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    templates,
    isLoading,
    error,
    fetchTemplates,
    createChoreTemplate,
    currentHousehold,
  };
};
