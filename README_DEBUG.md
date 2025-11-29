# Debugging Database Connection

If you are experiencing issues with the database connection ("itsnot,getting,database"), please follow these steps to verify the system status.

## 1. Check Database Connection
Run the following script to verify that the backend can connect to the PostgreSQL database:
```bash
cd backend
node test-db.js
```
Expected output: `✅ PostgreSQL connected successfully`

## 2. Check Existing Tables
Run this script to ensure all required tables exist:
```bash
cd backend
node check-tables.js
```
Expected output: A list of tables including `users`, `timetables`, `todos`, etc.

## 3. Check Data
Run this script to see if there is any data in the tables:
```bash
cd backend
node check-data.js
```
Expected output: Row counts for users and timetables.

## 4. Check Backend Server
Ensure the backend server is running.
```bash
cd backend
npm start
```
If it says `EADDRINUSE`, the server is already running. You can check its health by opening a new terminal and running:
```bash
curl http://localhost:5000/api/health
```
Expected output: `{"status":"ok"}`

## 5. Check Frontend Connection
Ensure the frontend is running:
```bash
cd frontend
npm run dev
```
Open the browser at `http://localhost:3000`.
If you see a login screen, try to log in.
If you see "Network Error", ensure the backend is running on port 5000.

## Common Issues
- **Database Password**: Check `backend/.env` and ensure `DB_PASSWORD` matches your PostgreSQL password.
- **PostgreSQL Service**: Ensure the PostgreSQL service is running on your machine.
- **Ports**: Ensure port 5000 (backend) and 3000 (frontend) are not blocked.
