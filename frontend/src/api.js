import axios from "axios";

export const API = axios.create({
  baseURL: "https://supplier-predictor.onrender.com", // Replace with your actual Render backend URL
});

export const runPipeline = () => API.get("/run-pipeline");
export const getBestSuppliers = (dc_city) => {
  // Add dc_city as a query parameter if it exists
  return API.get("/best-suppliers", {
    params: { dc_city: dc_city || null } // Pass null if dc_city is empty or undefined
  });
};
