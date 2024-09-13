import React from 'react';
import { useChoreTemplates } from '../../hooks/useChoreTemplates';
import ChoreForm from '../chores/ChoreForm';

const ChoreTemplateForm: React.FC = () => {
  const { createChoreTemplate } = useChoreTemplates();

  const handleSubmit = async (templateData: any) => {
    try {
      await createChoreTemplate(templateData);
      // Handle successful creation (e.g., show a success message, reset form, etc.)
    } catch (error) {
      console.error('Error creating chore template:', error);
      // Handle error (e.g., show an error message to the user)
    }
  };

  const handleCancel = () => {
    // Handle cancellation (e.g., reset form, close modal, etc.)
    console.log('Template creation cancelled');
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Create Chore Template</h2>
      <ChoreForm onSubmit={handleSubmit} onCancel={handleCancel} isTemplate={true} />
    </div>
  );
};

export default ChoreTemplateForm;
