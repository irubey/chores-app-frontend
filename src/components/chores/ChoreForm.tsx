import React, { useState } from 'react';

interface ChoreFormProps {
  onSubmit: (choreData: any) => void;
}

const ChoreForm: React.FC<ChoreFormProps> = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeEstimate, setTimeEstimate] = useState('');
  const [frequency, setFrequency] = useState('DAILY');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      timeEstimate: parseInt(timeEstimate, 10),
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
        Create Chore
      </button>
    </form>
  );
};

export default ChoreForm;
