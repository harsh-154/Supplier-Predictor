// frontend/src/api.js
import axios from "axios";

export const API = axios.create({
  baseURL: "http://localhost:8000", // Backend FastAPI
});

export const runPipeline = () => API.get("/run-pipeline");

// Modify getBestSuppliers to accept dcCity and pass it as a query parameter
export const getBestSuppliers = (dcCity) => {
  // If dcCity is provided, include it as a query parameter
  if (dcCity) {
    return API.get(`/best-suppliers?dc_city=${encodeURIComponent(dcCity)}`);
  }
  // Otherwise, call without the parameter (backend will use its default)
  return API.get("/best-suppliers");
};