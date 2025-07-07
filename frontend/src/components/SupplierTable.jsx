import React from "react";

export default function SupplierTable({ suppliers }) {
  if (!suppliers || suppliers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-lg">No supplier data available.</p>
        <p className="text-sm">Click "Run Pipeline" to generate data.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg shadow-lg">
      <table className="min-w-full divide-y divide-gray-700 bg-gray-700 text-gray-200">
        <thead className="bg-gray-600">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tl-lg">Product</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Supplier ID</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">City</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Country</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Combined Score</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Failure Prob</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tr-lg">Distance (km)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {suppliers.map((s, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-gray-700' : 'bg-gray-750'}> {/* Alternating row colors */}
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-300">{s.Product}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{s.SupplierID}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{s.City}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{s.Country}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-300">{s.CombinedScore?.toFixed(3)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-300">{s.FailureProb?.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-300">{s.DistanceKM?.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}