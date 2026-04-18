# EdgeRules Backend (Stage 1)

This is the backend skeleton for EdgeRules, a centralized API rule engine.

## Prerequisites

- Node.js (v18+ recommended)
- npm

## Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file (already created):
   ```env
   PORT=5000
   ```

## Running the Server

- Development (with nodemon):

  ```bash
  npm run dev
  ```

- Production:
  ```bash
  npm start
  ```

## API Endpoints (Stage 1)

- **Health Check**: `GET /health`
- **Register API**: `POST /api/register`
- **List APIs**: `GET /api/list`
- **Create Rule**: `POST /rules`
- **List Rules**: `GET /rules`

## Stack

- Express.js
- Clean Architecture (Controllers, Services, Routes)
- In-memory storage (Stage 1)



need to understand this 
# Rule evaluation flow
# Redis behavior
# Proxy lifecycle
# Failure cases