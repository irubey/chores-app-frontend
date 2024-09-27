'use client'

import React, { useState, useEffect } from 'react';

interface ChoreFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isTemplate?: boolean;
  initialData?: any;
  householdMembers: any[];
}

const ChoreForm: React.FC<ChoreFormProps> = ({ onSubmit, onCancel, isTemplate = false, initialData = null, householdMembers = [] }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    timeEstimate: '',
    frequency: 'DAILY',
    assignedTo: [] as string[],
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        timeEstimate: initialData.timeEstimate?.toString() || '',
        frequency: initialData.frequency || 'DAILY',
        assignedTo: initialData.assigned_to || [],
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    }
    if (formData.timeEstimate && (isNaN(Number(formData.timeEstimate)) || Number(formData.timeEstimate) <= 0)) {
      newErrors.timeEstimate = 'Time estimate must be a positive number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        timeEstimate: formData.timeEstimate ? parseInt(formData.timeEstimate, 10) : null,
        assignedTo: formData.assignedTo.length > 0 ? formData.assignedTo : [],
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAssignedToChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, assignedTo: selectedOptions.includes('all') ? [] : selectedOptions }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block mb-1">Title</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
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
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label htmlFor="timeEstimate" className="block mb-1">Time Estimate (minutes)</label>
        <input
          type="number"
          id="timeEstimate"
          name="timeEstimate"
          value={formData.timeEstimate}
          onChange={handleInputChange}
          min="1"
          className="w-full px-3 py-2 border rounded"
        />
        {errors.timeEstimate && <p className="text-red-500 text-sm mt-1">{errors.timeEstimate}</p>}
      </div>
      <div>
        <label htmlFor="frequency" className="block mb-1">Frequency</label>
        <select
          id="frequency"
          name="frequency"
          value={formData.frequency}
          onChange={handleInputChange}
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
        <label htmlFor="assignedTo" className="block mb-1">Who&apos;s responsible for this chore?</label>
        <select
          id="assignedTo"
          name="assignedTo"
          multiple
          value={formData.assignedTo.length > 0 ? formData.assignedTo : ['all']}
          onChange={handleAssignedToChange}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="all">Everyone</option>
          {Array.isArray(householdMembers) && householdMembers.map((member) => (
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