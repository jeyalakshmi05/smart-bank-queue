# Smart Bank Queue Management System

A beginner-friendly full-stack bank queue project using:

- HTML, CSS, JavaScript
- Node.js
- Express.js
- MongoDB
- Mongoose

## Features

### Customer
- Select a bank service
- Enter name/mobile
- Generate service-based token
- Track token status

### Staff
- Select counter
- View waiting queue
- Call next eligible customer
- Complete service
- Skip customer

### Admin
- View daily statistics
- CRUD services
- CRUD counters
- View token history/reports

### Smart Queue
A counter is assigned services. When staff clicks **Call Next**, the backend searches waiting customers whose service matches that counter, then prioritizes lower priority number and older waiting customers.

## Setup

### 1. Requirements

Install:
- Node.js
- MongoDB Community Server (or use MongoDB Atlas)

### 2. Install backend packages

Open terminal:

```bash
cd backend
npm install
```

### 3. Configure MongoDB

Copy `.env.example` to `.env`.

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

For local MongoDB, `.env` can contain:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/smart_bank_queue
```

### 4. Start backend

```bash
npm run dev
```

You should see:

```text
MongoDB connected
Server running at http://localhost:5000
```

### 5. Open the application

Open:

```text
http://localhost:5000
```

## First-time configuration

1. Open `Admin`.
2. Open `Services`.
3. Add services such as:
   - Cash Withdrawal / A
   - Cash Deposit / A
   - FD / B
   - RD / B
   - Account Opening / C
   - Loan / D
   - Mutual Funds / E
4. Open `Counters`.
5. Add counters and assign their supported services.
6. Open `Customer`.
7. Generate a token.
8. Open `Staff`.
9. Select a counter.
10. Click `Call Next`.
11. Complete the service.
12. Open `Reports`.

## Important note

This is an academic/demo project. It does not implement production-grade authentication, authorization, audit controls, encryption, or bank regulatory requirements. Do not use real customer financial information.
