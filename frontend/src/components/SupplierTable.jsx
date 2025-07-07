import React from "react";

export default function SupplierTable({ suppliers }) {
  if (!suppliers || suppliers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-lg">No supplier data available.</p>
        <p className="text-sm">Click "Run Pipeline" to generate data, or select a different warehouse city.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg shadow-lg">
      <table className="min-w-full divide-y divide-gray-700 bg-gray-700 text-gray-200">
        <thead className="bg-gray-600">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tl-lg">Supplier ID</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Supplier Name</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Product ID</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Product Name</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Category</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">City</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Country</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Lead Time (Days)</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Reliability</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Capacity</th>
            {/* New Columns for Weather Risk and War Risk */}
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Weather Risk</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">War Risk</th>
            {/* End New Columns */}
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Failure Prob</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Combined Score</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tr-lg">Distance (km)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {suppliers.map((s, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-gray-700' : 'bg-gray-750'}> {/* Alternating row colors */}
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-300">{s.SupplierID}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{s.SupplierName}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{s.ProductID}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-300">{s.Product}</td> {/* Product Name is now 'Product' */}
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{s.Category}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{s.City}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{s.Country}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-yellow-300">{s.LeadTimeDays}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-green-300">{s.PastReliability?.toFixed(2)}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-purple-300">{s.Capacity}</td>
              {/* New Data Cells for Weather Risk and War Risk */}
              <td className="px-4 py-4 whitespace-nowrap text-sm text-orange-300">{s.WeatherRisk?.toFixed(2)}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-red-300">{s.WarRisk?.toFixed(2)}</td>
              {/* End New Data Cells */}
              <td className="px-4 py-4 whitespace-nowrap text-sm text-red-400">{s.FailureProb?.toFixed(2)}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-teal-400">{s.CombinedScore?.toFixed(3)}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-400">{s.DistanceKM?.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
