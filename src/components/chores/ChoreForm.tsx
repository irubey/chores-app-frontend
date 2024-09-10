import React, { useState } from 'react';
import ChoreTemplateList from '../templates/ChoreTemplateList';


interface ChoreFormProps {
  onSubmit: (data: any) => void;
  isTemplate?: boolean;
  initialData?: any;
}

const ChoreForm: React.FC<ChoreFormProps> = ({ onSubmit, isTemplate = false, initialData = null }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [timeEstimate, setTimeEstimate] = useState(initialData?.timeEstimate?.toString() || '');
  const [frequency, setFrequency] = useState(initialData?.frequency || 'DAILY');

  const [useTemplate, setUseTemplate] = useState(false);

  const handleTemplateSelect = (template: any) => {
    setTitle(template.title);
    setDescription(template.description);
    setTimeEstimate(template.timeEstimate.toString());
    setFrequency(template.frequency);
    setUseTemplate(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      time_estimate: parseInt(timeEstimate, 10),
      frequency,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block mb-1">Title</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label htmlFor="description" className="block mb-1">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label htmlFor="timeEstimate" className="block mb-1">Time Estimate (minutes)</label>
        <input
          type="number"
          id="timeEstimate"
          value={timeEstimate}
          onChange={(e) => setTimeEstimate(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label htmlFor="frequency" className="block mb-1">Frequency</label>
        <select
          id="frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        >
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">Weekly</option>
          <option value="MONTHLY">Monthly</option>
          <option value="CUSTOM">Custom</option>
        </select>
      </div>
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        {isTemplate ? 'Create Chore Template' : 'Create Chore'}
      </button>
    </form>
  );
};

export default ChoreForm;