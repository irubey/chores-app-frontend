import React from 'react';
import { useChoreTemplates } from '../../hooks/useChoreTemplates';
import ChoreTemplateItem from './ChoreTemplateItem';

interface ChoreTemplateListProps {
  onSelectTemplate: (template: any) => void;
  selectedTemplate?: any;
}

const ChoreTemplateList: React.FC<ChoreTemplateListProps> = ({ onSelectTemplate, selectedTemplate }) => {
  const { templates, isLoading, error, fetchTemplates, currentHousehold } = useChoreTemplates();

  React.useEffect(() => {
    if (currentHousehold) {
      fetchTemplates();
    }
  }, [fetchTemplates, currentHousehold]);

  if (isLoading) return <div>Loading templates...</div>;
  if (error) return <div>Error loading templates: {error}</div>;

  const sortedTemplates = [...templates].sort((a, b) => 
    a.id === selectedTemplate?.id ? -1 : b.id === selectedTemplate?.id ? 1 : 0
  );

  return (
    <div className="space-y-4">
      {sortedTemplates.length > 0 ? (
        sortedTemplates.map((template) => (
          <ChoreTemplateItem
            key={template.id}
            template={template}
            onSelect={() => onSelectTemplate(template)}
            isSelected={template.id === selectedTemplate?.id}
          />
        ))
      ) : (
        <p>No templates available.</p>
      )}
    </div>
  );
};

export default ChoreTemplateList;
