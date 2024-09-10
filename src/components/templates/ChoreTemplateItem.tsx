import React from 'react';
import { ChoreTemplate } from '../../hooks/useChoreTemplates';

interface ChoreTemplateItemProps {
  template: ChoreTemplate;
  onSelect: (template: ChoreTemplate) => void;
}

const ChoreTemplateItem: React.FC<ChoreTemplateItemProps> = ({ template, onSelect }) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h3 className="text-lg font-semibold">{template.title}</h3>
        <p className="text-sm text-gray-600">{template.description}</p>
        <p className="text-sm text-gray-500">
          Estimated time: {template.timeEstimate} minutes | Frequency: {template.frequency}
        </p>
      </div>
      <button
        onClick={() => onSelect(template)}
        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
      >
        Use Template
      </button>
    </div>
  );
};

export default ChoreTemplateItem;
