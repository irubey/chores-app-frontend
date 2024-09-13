import React, { useState, useEffect } from 'react';
import ChoreTemplateList from '../templates/ChoreTemplateList';


interface ChoreFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isTemplate?: boolean;
  initialData?: any;
  householdMembers: any[];
}

const ChoreForm: React.FC<ChoreFormProps> = ({ onSubmit, onCancel, isTemplate = false, initialData = null, householdMembers }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [timeEstimate, setTimeEstimate] = useState(initialData?.timeEstimate?.toString() || '');
  const [frequency, setFrequency] = useState(initialData?.frequency || 'DAILY');
  const [assignedTo, setAssignedTo] = useState<string[]>(initialData?.assignedTo || []);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setTimeEstimate(initialData.timeEstimate?.toString() || '');
      setFrequency(initialData.frequency || 'DAILY');
      setAssignedTo(initialData.assigned_to || []);
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    }
    if (timeEstimate && (isNaN(Number(timeEstimate)) || Number(timeEstimate) <= 0)) {
      newErrors.timeEstimate = 'Time estimate must be a positive number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        title,
        description,
        time_estimate: timeEstimate ? parseInt(timeEstimate, 10) : null,
        frequency,
        assignedTo: assignedTo.length > 0 ? assignedTo : null,
      });
    }
  };

  const handleAssignedToChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setAssignedTo(selectedOptions.includes('all') ? [] : selectedOptions);
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
          minLength={3}
          className="w-full px-3 py-2 border rounded"
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
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
          min="1"
          className="w-full px-3 py-2 border rounded"
        />
        {errors.timeEstimate && <p className="text-red-500 text-sm mt-1">{errors.timeEstimate}</p>}
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
      <div>
        <label htmlFor="assignedTo" className="block mb-1">Who's responsible for this chore?</label>
        <select
          id="assignedTo"
          multiple
          value={assignedTo.length > 0 ? assignedTo : ['all']}
          onChange={handleAssignedToChange}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="all">Everyone</option>
          {householdMembers.map(member => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-between">
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          {isTemplate ? 'Create Chore Template' : 'Create Chore'}
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ChoreForm;