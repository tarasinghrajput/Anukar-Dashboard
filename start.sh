#!/bin/bash

# Anukar Dashboard Startup Script
# Starts MongoDB, syncs data, and launches the dashboard

set -e

echo "═══════════════════════════════════════════"
echo "  Anukar Dashboard - Startup Script"
echo "═══════════════════════════════════════════"

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Start MongoDB container
echo ""
echo "📦 Starting MongoDB container..."
docker compose up -d mongodb

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 3

# Check if MongoDB is running
until docker exec anukar-mongodb mongosh --eval "db.stats()" > /dev/null 2>&1; do
    echo "   MongoDB is starting..."
    sleep 2
done
echo "✅ MongoDB is ready!"

# Install backend dependencies if needed
cd backend
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Sync data from GitHub and Google Sheets
echo ""
echo "🔄 Syncing data from GitHub and Google Sheets..."
npm run sync

# Start backend in background
echo ""
echo "🚀 Starting backend server..."
npm start &
BACKEND_PID=$!

# Install frontend dependencies if needed
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start frontend
echo ""
echo "🎨 Starting frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ Anukar Dashboard is running!"
echo "═══════════════════════════════════════════"
echo ""
echo "  🌐 Frontend:  http://localhost:5173"
echo "  🔌 Backend:   http://localhost:3000"
echo "  🗄️  MongoDB:   localhost:27017"
echo ""
echo "  Press Ctrl+C to stop all services"
echo ""

# Wait for processes
trap "echo ''; echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker compose down; exit 0" INT TERM
wait
