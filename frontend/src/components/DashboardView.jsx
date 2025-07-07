import React from 'react';

export default function DashboardView({ suppliers }) {
  if (!suppliers || suppliers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-lg">No supplier data available for dashboard.</p>
        <p className="text-sm">Click "Run Pipeline" to generate data.</p>
      </div>
    );
  }

  // Calculate some aggregate statistics
  const totalSuppliers = suppliers.length;
  const totalProducts = new Set(suppliers.map(s => s.Product)).size;
  const avgFailureProb = (suppliers.reduce((sum, s) => sum + (s.FailureProb || 0), 0) / totalSuppliers).toFixed(2);
  const avgDistance = (suppliers.reduce((sum, s) => sum + (s.DistanceKM || 0), 0) / totalSuppliers).toFixed(1);
  const avgCombinedScore = (suppliers.reduce((sum, s) => sum + (s.CombinedScore || 0), 0) / totalSuppliers).toFixed(3);

  // You can add more complex charts/graphs here using libraries like Recharts or D3.js

  return (
    <div className="bg-gray-700 p-6 rounded-lg shadow-xl mt-6">
      <h2 className="text-3xl font-bold text-blue-300 mb-6 text-center">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-600 p-5 rounded-lg shadow-md flex flex-col items-center">
          <p className="text-sm text-gray-300">Total Suppliers</p>
          <p className="text-4xl font-bold text-green-400 mt-2">{totalSuppliers}</p>
        </div>
        <div className="bg-gray-600 p-5 rounded-lg shadow-md flex flex-col items-center">
          <p className="text-sm text-gray-300">Unique Products</p>
          <p className="text-4xl font-bold text-yellow-400 mt-2">{totalProducts}</p>
        </div>
        <div className="bg-gray-600 p-5 rounded-lg shadow-md flex flex-col items-center">
          <p className="text-sm text-gray-300">Avg. Failure Probability</p>
          <p className="text-4xl font-bold text-red-400 mt-2">{avgFailureProb}</p>
        </div>
        <div className="bg-gray-600 p-5 rounded-lg shadow-md flex flex-col items-center">
          <p className="text-sm text-gray-300">Avg. Distance (KM)</p>
          <p className="text-4xl font-bold text-purple-400 mt-2">{avgDistance}</p>
        </div>
        <div className="bg-gray-600 p-5 rounded-lg shadow-md flex flex-col items-center">
          <p className="text-sm text-gray-300">Avg. Combined Score</p>
          <p className="text-4xl font-bold text-teal-400 mt-2">{avgCombinedScore}</p>
        </div>
        {/* Add more dashboard elements here */}
      </div>
    </div>
  );
}