'use client'

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useHousehold } from '../../hooks/useHousehold';
import { useChores, Chore } from '../../hooks/useChores';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ChoreDistributionChart: React.FC = () => {
  const { currentHousehold } = useHousehold();
  const { chores } = useChores();

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