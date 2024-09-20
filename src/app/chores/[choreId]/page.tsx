import React from 'react';

interface ChorePageProps {
  params: { id: string }
}

export default function ChorePage({ params }: ChorePageProps) {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Chore Details</h1>
      <p className="mb-2">Chore ID: {params.id}</p>
      {/* You can add more details here once you fetch the chore data */}
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Edit Chore
      </button>
    </div>
  );
}
