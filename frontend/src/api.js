import axios from "axios";

export const API = axios.create({
  baseURL: "http://localhost:8000", // Backend FastAPI
});

export const runPipeline = () => API.get("/run-pipeline");
export const getBestSuppliers = () => API.get("/best-suppliers");
