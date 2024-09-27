'use client'

import React from 'react';
import { useDebts } from '../../hooks/useDebts';

const DebtSummary: React.FC = () => {
  const { debts } = useDebts();

  const totalDebts = debts.length;
  const totalAmount = debts.reduce((sum, debt) => sum + debt.amount, 0);
  const debtsOwed = debts.filter(debt => debt.owedTo === currentUser.id).length;
  const debtsOwedTo = debts.filter(debt => debt.owedTo !== currentUser.id).length;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Debt Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-gray-600">Total Debts</p>
          <p className="text-2xl font-bold">{totalDebts}</p>
        </div>
        <div>
          <p className="text-gray-600">Total Amount</p>
          <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-600">Debts Owed</p>
          <p className="text-2xl font-bold">{debtsOwed}</p>
        </div>
        <div>
          <p className="text-gray-600">Debts Owed To</p>
          <p className="text-2xl font-bold">{debtsOwedTo}</p>
        </div>
      </div>
    </div>
  );
};

export default DebtSummary;
