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
  const uniqueProducts = new Set(suppliers.map(s => s.Product)).size; // Using 'Product' from pipeline
  const uniqueCategories = new Set(suppliers.map(s => s.Category)).size; // New metric
  const avgFailureProb = (suppliers.reduce((sum, s) => sum + (s.FailureProb || 0), 0) / totalSuppliers).toFixed(2);
  const avgDistance = (suppliers.reduce((sum, s) => sum + (s.DistanceKM || 0), 0) / totalSuppliers).toFixed(1);
  const avgCombinedScore = (suppliers.reduce((sum, s) => sum + (s.CombinedScore || 0), 0) / totalSuppliers).toFixed(3);

  // Count suppliers by category
  const suppliersByCategory = suppliers.reduce((acc, s) => {
    acc[s.Category] = (acc[s.Category] || 0) + 1;
    return acc;
  }, {});

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
          <p className="text-4xl font-bold text-yellow-400 mt-2">{uniqueProducts}</p>
        </div>
        <div className="bg-gray-600 p-5 rounded-lg shadow-md flex flex-col items-center">
          <p className="text-sm text-gray-300">Unique Categories</p>
          <p className="text-4xl font-bold text-purple-400 mt-2">{uniqueCategories}</p>
        </div>
        <div className="bg-gray-600 p-5 rounded-lg shadow-md flex flex-col items-center">
          <p className="text-sm text-gray-300">Avg. Failure Probability</p>
          <p className="text-4xl font-bold text-red-400 mt-2">{avgFailureProb}</p>
        </div>
        <div className="bg-gray-600 p-5 rounded-lg shadow-md flex flex-col items-center">
          <p className="text-sm text-gray-300">Avg. Distance (KM)</p>
          <p className="text-4xl font-bold text-teal-400 mt-2">{avgDistance}</p>
        </div>
        <div className="bg-gray-600 p-5 rounded-lg shadow-md flex flex-col items-center">
          <p className="text-sm text-gray-300">Avg. Combined Score</p>
          <p className="text-4xl font-bold text-orange-400 mt-2">{avgCombinedScore}</p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-2xl font-semibold text-blue-300 mb-4 text-center">Suppliers by Category</h3>
        <div className="flex flex-wrap justify-center gap-4">
          {Object.entries(suppliersByCategory).map(([category, count]) => (
            <div key={category} className="bg-gray-600 p-4 rounded-lg shadow-md flex-1 min-w-[150px] max-w-[200px] text-center">
              <p className="text-lg text-gray-300">{category}</p>
              <p className="text-3xl font-bold text-green-300 mt-1">{count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}