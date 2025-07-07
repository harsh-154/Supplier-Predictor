from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pipeline import run_pipeline, get_best_suppliers

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/run-pipeline")
def run():
    run_pipeline()
    return {"message": "Pipeline complete."}

@app.get("/best-suppliers")
def best_suppliers():
    return get_best_suppliers()
