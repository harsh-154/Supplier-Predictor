import React, { useState, useEffect, useCallback, useRef } from "react";
import { runPipeline, getBestSuppliers } from "./api";
import SupplierTable from "./components/SupplierTable";
import DashboardView from "./components/DashboardView";
import MapView from "./components/MapView";
import WarehouseTable from "./components/WarehouseTable";

function App() {
  const [bestSuppliers, setBestSuppliers] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [showBest, setShowBest] = useState(true);
  const [selectedDcCity, setSelectedDcCity] = useState("");
  const [uniqueCities, setUniqueCities] = useState([]);

  // Flag to track if initial data fetch is complete and selectedDcCity has been set for the first time.
  const hasLoadedInitialData = useRef(false);

  const fetchSuppliers = useCallback(async (cityToFetch) => {
    setLoading(true);
    setMessage(`Fetching supplier data for ${cityToFetch || 'default city'}...`);
    try {
      const { data } = await getBestSuppliers(cityToFetch);
      setBestSuppliers(data.best_suppliers);
      setAllSuppliers(data.all_suppliers);
      // It's important to only update uniqueCities if they are actually different
      // to avoid unnecessary re-renders. Though for this specific loop,
      // removing it from dependency array is the primary fix.
      setUniqueCities(data.unique_cities);
      setWarehouses(data.warehouses);
      setMessage("Supplier data loaded successfully.");
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setMessage("Failed to load suppliers. Check backend server and data.");
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array: this function is stable and won't re-create

  // Effect for initial data load on component mount
  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      setMessage("Loading initial data...");
      try {
        const { data } = await getBestSuppliers(null); // Fetch with null initially for backend default
        setBestSuppliers(data.best_suppliers);
        setAllSuppliers(data.all_suppliers);
        setUniqueCities(data.unique_cities);
        setWarehouses(data.warehouses);

        // Set the initial selected DC city ONLY IF it hasn't been set by this initial load.
        // This prevents the infinite loop with the second useEffect.
        if (data.unique_cities.length > 0 && !hasLoadedInitialData.current) {
          setSelectedDcCity(data.unique_cities[0]);
          hasLoadedInitialData.current = true; // Mark as loaded
        } else if (data.unique_cities.length === 0) {
          setSelectedDcCity(""); // No cities available
        }
        setMessage("Initial data loaded.");
      } catch (error) {
        console.error("Error during initial data load:", error);
        setMessage("Failed to load initial data. Check backend server and data.");
      } finally {
        setLoading(false);
      }
    };

    initialLoad();
  }, []); // Empty dependency array: runs only once on mount

  // Effect to re-fetch suppliers when selectedDcCity changes from user interaction
  useEffect(() => {
    // This effect should only run AFTER the initial data has been loaded AND
    // if a selectedDcCity is genuinely set and is one of the valid unique cities.
    // We remove uniqueCities from dependencies to prevent circular updates.
    if (hasLoadedInitialData.current && selectedDcCity && uniqueCities.includes(selectedDcCity)) {
      fetchSuppliers(selectedDcCity);
    }
  }, [selectedDcCity, fetchSuppliers]); // Removed uniqueCities from dependencies

  const handleRunPipeline = async () => {
    setLoading(true);
    setMessage("Running data pipeline... This might take a moment.");
    try {
      await runPipeline();
      setMessage("Pipeline complete. Fetching updated supplier data...");
      // After pipeline runs, re-fetch data using the currently selected DC city.
      await fetchSuppliers(selectedDcCity);
    } catch (error) {
      console.error("Error running pipeline:", error);
      setMessage("Failed to run pipeline. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 flex flex-col items-center justify-center font-inter">
      <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-5xl">
        <h1 className="text-4xl font-bold mb-6 text-blue-400 flex items-center justify-center">
          <span className="mr-3">📦</span> Supply Chain Resilience Dashboard
        </h1>

        {/* Navbar-like container for main actions and view selection */}
        <div className="bg-gray-700 p-4 rounded-lg shadow-md mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Run Pipeline Button */}
          <button
            onClick={handleRunPipeline}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg transform transition duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 text-base md:text-lg w-full md:w-auto"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <>🔄 Run Pipeline</>
            )}
          </button>

          {/* View selection buttons */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 w-full md:w-auto">
            <button
              onClick={() => setViewMode("table")}
              className={`py-2 px-4 rounded-full shadow-md transform transition duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 text-sm md:text-base ${
                viewMode === "table" ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
              disabled={loading}
            >
              📋 Table
            </button>

            <button
              onClick={() => setViewMode("dashboard")}
              className={`py-2 px-4 rounded-full shadow-md transform transition duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 text-sm md:text-base ${
                viewMode === "dashboard" ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
              disabled={loading}
            >
              📈 Dashboard
            </button>

            <button
              onClick={() => setViewMode("map")}
              className={`py-2 px-4 rounded-full shadow-md transform transition duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 text-sm md:text-base ${
                viewMode === "map" ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
              disabled={loading}
            >
              🗺️ Map
            </button>

            <button
              onClick={() => setViewMode("warehouses")}
              className={`py-2 px-4 rounded-full shadow-md transform transition duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 text-sm md:text-base ${
                viewMode === "warehouses" ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
              disabled={loading}
            >
              🏢 Warehouses
            </button>
          </div>

          {/* Warehouse City Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
            <label htmlFor="dc-city-select" className="text-base md:text-lg text-gray-300 whitespace-nowrap">
              Warehouse:
            </label>
            <select
              id="dc-city-select"
              value={selectedDcCity}
              onChange={(e) => setSelectedDcCity(e.target.value)}
              className="p-2 rounded-md bg-gray-700 border border-gray-600 text-white text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              disabled={loading || uniqueCities.length === 0}
            >
              {uniqueCities.length > 0 ? (
                uniqueCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))
              ) : (
                <option value="">No cities</option>
              )}
            </select>
          </div>
        </div>

        {/* Message display */}
        {message && (
          <p className="text-sm text-gray-400 mb-4 text-center">{message}</p>
        )}

        {/* Conditional rendering of views */}
        {loading && bestSuppliers.length === 0 && allSuppliers.length === 0 ? (
          <p className="text-xl text-blue-300 text-center">Loading supplier data...</p>
        ) : (
          <>
            {viewMode === "table" && (
              <div className="flex flex-col gap-4">
                <h2 className="text-2xl font-semibold text-blue-300 mt-4 text-center">
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
              <MapView suppliers={allSuppliers} selectedDcCity={selectedDcCity} warehouses={warehouses} />
            )}

            {viewMode === "warehouses" && (
              <WarehouseTable warehouses={warehouses} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;