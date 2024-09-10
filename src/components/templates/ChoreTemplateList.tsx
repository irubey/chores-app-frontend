import React from 'react';
import { useChoreTemplates } from '../../hooks/useChoreTemplates';
import ChoreTemplateItem from './ChoreTemplateItem';

interface ChoreTemplateListProps {
  onSelectTemplate: (template: any) => void;
}

const ChoreTemplateList: React.FC<ChoreTemplateListProps> = ({ onSelectTemplate }) => {
  const { templates, isLoading, error, fetchTemplates, currentHousehold } = useChoreTemplates();

  React.useEffect(() => {
    if (currentHousehold) {
      fetchTemplates();
    }
  }, [fetchTemplates, currentHousehold]);

  if (isLoading) return <div>Loading templates...</div>;
  if (error) return <div>Error loading templates: {error}</div>;

  return (
    <div className="space-y-4">
      {templates.length > 0 ? (
        templates.map((template) => (
          <ChoreTemplateItem
            key={template.id}
            template={template}
            onSelect={() => onSelectTemplate(template)}
          />
        ))
      ) : (
        <p>No templates available.</p>
      )}
    </div>
  );
};

export default ChoreTemplateList;
