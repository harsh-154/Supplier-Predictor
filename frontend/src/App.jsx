import React, { useState, useEffect } from "react";
import { runPipeline, getBestSuppliers } from "./api";
import SupplierTable from "./components/SupplierTable";
import DashboardView from "./components/DashboardView"; // New component
import MapView from "./components/MapView"; // New component

function App() {
  const [bestSuppliers, setBestSuppliers] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [viewMode, setViewMode] = useState("table"); // 'table', 'dashboard', 'map'
  const [showBest, setShowBest] = useState(true); // Moved this state to top-level

  const fetchSuppliers = async () => {
    setLoading(true);
    setMessage("Fetching supplier data...");
    try {
      const { data } = await getBestSuppliers();
      setBestSuppliers(data.best_suppliers);
      setAllSuppliers(data.all_suppliers);
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
      await fetchSuppliers();
    } catch (error) {
      console.error("Error running pipeline:", error);
      setMessage("Failed to run pipeline. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 flex flex-col items-center justify-center font-inter">
      <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-5xl"> {/* Increased max-w */}
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
                {/* Table-specific toggle buttons, now correctly within the table view */}
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
              <MapView suppliers={allSuppliers} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;