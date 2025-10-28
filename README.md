# Car Number Plate Recognition - Full Project

This repository contains a beginner-friendly full-stack Automatic Number Plate Recognition (ANPR) project.

## How to run (local)

### Backend
cd backend
python -m venv venv
# activate venv
# Windows (cmd): venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python app.py

### Frontend
cd frontend
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm start

Make sure backend is running at http://localhost:8000
