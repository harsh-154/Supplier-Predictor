import React, { useState, useEffect } from "react";
import { runPipeline, getBestSuppliers } from "./api";
import SupplierTable from "./components/SupplierTable";
import DashboardView from "./components/DashboardView";
import MapView from "./components/MapView";

function App() {
  const [bestSuppliers, setBestSuppliers] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [viewMode, setViewMode] = useState("table"); // 'table', 'dashboard', 'map'
  const [showBest, setShowBest] = useState(true);
  const [selectedDcCity, setSelectedDcCity] = useState(""); // State for selected DC city
  const [uniqueCities, setUniqueCities] = useState([]); // State for unique cities from backend

  const fetchSuppliers = async (city = selectedDcCity) => {
    setLoading(true);
    setMessage("Fetching supplier data...");
    try {
      const { data } = await getBestSuppliers(city); // Pass selected city to API
      setBestSuppliers(data.best_suppliers);
      setAllSuppliers(data.all_suppliers);
      setUniqueCities(data.unique_cities); // Set unique cities

      // If no city was selected yet, default to the first one from the fetched list
      // This ensures a default city is always selected in the dropdown
      if (!city && data.unique_cities.length > 0) {
        setSelectedDcCity(data.unique_cities[0]);
      } else if (city && !data.unique_cities.includes(city)) {
        // If the previously selected city is no longer in the list (e.g., after pipeline run with new data)
        // default to the first available city.
        setSelectedDcCity(data.unique_cities[0] || "");
      }
      setMessage("Supplier data loaded successfully.");
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setMessage("Failed to load suppliers. Check backend server and data.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunPipeline = async () => {
    setLoading(true);
    setMessage("Running data pipeline... This might take a moment.");
    try {
      await runPipeline();
      setMessage("Pipeline complete. Fetching updated supplier data...");
      // After pipeline runs, re-fetch data, which will also update uniqueCities
      // and potentially reset selectedDcCity if the previous one is no longer valid.
      await fetchSuppliers(selectedDcCity);
    } catch (error) {
      console.error("Error running pipeline:", error);
      setMessage("Failed to run pipeline. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial data fetch when the component mounts
    fetchSuppliers();
  }, []);

  // Effect to re-fetch suppliers when selectedDcCity changes
  // This ensures the table and map update when a new warehouse city is chosen
  useEffect(() => {
    // Only refetch if a city is actually selected and it's different from the current one
    // This prevents infinite loops or unnecessary fetches on initial load
    if (selectedDcCity && uniqueCities.length > 0) {
      fetchSuppliers(selectedDcCity);
    }
  }, [selectedDcCity]); // Dependency array includes selectedDcCity

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 flex flex-col items-center justify-center font-inter">
      <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-5xl">
        <h1 className="text-4xl font-bold mb-6 text-blue-400 flex items-center justify-center">
          <span className="mr-3">📦</span> Supply Chain Resilience Dashboard
        </h1>

        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <button
            onClick={handleRunPipeline}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-full shadow-lg transform transition duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 text-lg"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <>🔄 Run Pipeline</>
            )}
          </button>

          {/* Main view selection buttons */}
          <button
            onClick={() => setViewMode("table")}
            className={`py-3 px-6 rounded-full shadow-lg transform transition duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 text-lg ${
              viewMode === "table" ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            disabled={loading}
          >
            📋 Table View
          </button>

          <button
            onClick={() => setViewMode("dashboard")}
            className={`py-3 px-6 rounded-full shadow-lg transform transition duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 text-lg ${
              viewMode === "dashboard" ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            disabled={loading}
          >
            📈 Dashboard View
          </button>

          <button
            onClick={() => setViewMode("map")}
            className={`py-3 px-6 rounded-full shadow-lg transform transition duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 text-lg ${
              viewMode === "map" ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            disabled={loading}
          >
            🗺️ Map View
          </button>
        </div>

        {/* Warehouse City Dropdown */}
        <div className="mb-6 flex justify-center items-center gap-3">
          <label htmlFor="dc-city-select" className="text-lg text-gray-300">
            Select Warehouse City:
          </label>
          <select
            id="dc-city-select"
            value={selectedDcCity}
            onChange={(e) => setSelectedDcCity(e.target.value)}
            className="p-2 rounded-md bg-gray-700 border border-gray-600 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading || uniqueCities.length === 0}
          >
            {uniqueCities.length > 0 ? (
              uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))
            ) : (
              <option value="">No cities available</option>
            )}
          </select>
        </div>

        {message && (
          <p className="text-sm text-gray-400 mb-4">{message}</p>
        )}

        {loading && bestSuppliers.length === 0 && allSuppliers.length === 0 ? (
          <p className="text-xl text-blue-300">Loading supplier data...</p>
        ) : (
          <>
            {viewMode === "table" && (
              <div className="flex flex-col gap-4">
                <h2 className="text-2xl font-semibold text-blue-300 mt-4">
                  {showBest ? "🏆 Best Suppliers by Product" : "📊 All Suppliers"}
                </h2>
                <div className="flex justify-center gap-2 mb-4">
                  <button
                    onClick={() => setShowBest(true)}
                    className={`py-2 px-4 rounded-full text-sm ${
                      showBest ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    Show Best
                  </button>
                  <button
                    onClick={() => setShowBest(false)}
                    className={`py-2 px-4 rounded-full text-sm ${
                      !showBest ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    Show All
                  </button>
                </div>
                <SupplierTable suppliers={showBest ? bestSuppliers : allSuppliers} />
              </div>
            )}

            {viewMode === "dashboard" && (
              <DashboardView suppliers={allSuppliers} />
            )}

            {viewMode === "map" && (
              <MapView suppliers={allSuppliers} selectedDcCity={selectedDcCity} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;