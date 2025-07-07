#!/bin/bash

# Backend
echo "🔧 Starting backend (FastAPI)..."
cd backend || exit
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload &
cd ..

# Frontend
echo "🌐 Starting frontend (Vite React)..."
cd frontend || exit
npm install
npm run dev
