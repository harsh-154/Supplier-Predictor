import React, { useState, useEffect } from "react";
import { runPipeline, getBestSuppliers } from "./api";
import SupplierTable from "./components/SupplierTable";

function App() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    const { data } = await getBestSuppliers();
    setSuppliers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>📦 Best Suppliers by Product</h1>
      <button
        onClick={async () => {
          await runPipeline();
          fetchSuppliers();
        }}
        style={{ marginBottom: "20px", padding: "8px 12px" }}
      >
        🔄 Run Pipeline
      </button>
      {loading ? <p>Loading...</p> : <SupplierTable suppliers={suppliers} />}
    </div>
  );
}

export default App;
