'use client'

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useHousehold } from '../../hooks/useHousehold';
import { useChores } from '../../hooks/useChores';
import { useRouter } from 'next/navigation';
import ChoreTemplateForm from '../templates/ChoreTemplateForm';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ChoreDistributionChart: React.FC = () => {
  const { currentHousehold, isLoading: isHouseholdLoading } = useHousehold();
  const { chores, isLoading: isChoresLoading } = useChores();
  const router = useRouter();

  if (isHouseholdLoading || isChoresLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Chore Distribution</h2>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentHousehold || chores.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Chore Distribution</h2>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No chores found for this household.</p>
          <button
            onClick={() => router.push('/chores/create')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Create a Chore
          </button>
        </div>
      </div>
    );
  }

  const choreDistribution = currentHousehold?.members.reduce((acc, member) => {
    acc[member.name] = chores
      .filter(chore => chore.assignedTo === member.id)
      .reduce((sum, chore) => {
        sum[chore.title] = (sum[chore.title] || 0) + (chore.timeEstimate || 0);
        return sum;
      }, {} as Record<string, number>);
    return acc;
  }, {} as Record<string, Record<string, number>>) || {};

  const labels = Object.keys(choreDistribution);
  const datasets = Object.keys(chores.reduce((acc, chore) => {
    acc[chore.title] = true;
    return acc;
  }, {} as Record<string, boolean>)).map((choreName, index) => ({
    label: choreName,
    data: labels.map(memberName => choreDistribution[memberName][choreName] || 0),
    backgroundColor: `hsl(${index * 360 / Object.keys(chores).length}, 70%, 50%)`,
  }));

  const data = {
    labels,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Estimated Time (minutes)',
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Chore Distribution by Household Member',
      },
    },
  };
  if (labels.length === 0 || datasets.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Chore Distribution</h2>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No chores assigned yet.</p>
          <ChoreTemplateForm />
        </div>
      </div>
    );
  }


  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Chore Distribution</h2>
      <div className="h-64">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default ChoreDistributionChart;