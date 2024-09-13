import React from 'react';
import { ChoreTemplate } from '../../hooks/useChoreTemplates';

interface ChoreTemplateItemProps {
  template: ChoreTemplate;
  onSelect: (template: ChoreTemplate) => void;
  isSelected: boolean;
}

const ChoreTemplateItem: React.FC<ChoreTemplateItemProps> = ({ template, onSelect, isSelected }) => {
  return (
    <div className={`flex justify-between items-center p-2 rounded ${isSelected ? 'bg-blue-100' : ''}`}>
      <div className="flex-grow mr-4 overflow-hidden">
        <h3 className="text-lg font-semibold truncate">{template.title}</h3>
        <p className="text-sm text-gray-600 truncate">{template.description}</p>
      </div>
      <button
        onClick={() => onSelect(template)}
        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors flex-shrink-0"
      >
        {isSelected ? 'Selected' : 'Use Template'}
      </button>
    </div>
  );
};

export default ChoreTemplateItem;
