import React from 'react';

export default function WarehouseTable({ warehouses }) { // Changed prop to 'warehouses'
  if (!warehouses || warehouses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-lg">No warehouse data available.</p>
        <p className="text-sm">Run the pipeline to generate data containing warehouse cities.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-700 p-6 rounded-lg shadow-xl mt-6 overflow-x-auto">
      <h2 className="text-3xl font-bold text-blue-300 mb-6 text-center">Available Warehouses</h2>
      <table className="min-w-full divide-y divide-gray-600 bg-gray-700 text-gray-200 rounded-lg">
        <thead className="bg-gray-600">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tl-lg">Warehouse ID</th> {/* New column */}
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">City</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Country</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Latitude</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tr-lg">Longitude</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-600">
          {warehouses.map((warehouse, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-gray-700' : 'bg-gray-750'}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-300">{warehouse.WarehouseID}</td> {/* Display WarehouseID */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{warehouse.City}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{warehouse.Country}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{warehouse.Latitude?.toFixed(4)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{warehouse.Longitude?.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
