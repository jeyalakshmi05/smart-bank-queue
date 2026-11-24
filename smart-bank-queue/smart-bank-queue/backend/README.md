# SmartBank Queue Management System - Backend

REST API for a bank queue system. Customers take tokens, staff serve them at counters, and admins manage services, counters and staff.

## Tech Stack

- Node.js and Express 5
- MongoDB with Mongoose
- JWT authentication (`jsonwebtoken`) and password hashing (`bcryptjs`)
- `cors` and `dotenv`
- `nodemon` for development

## Requirements

- Node.js (LTS version)
- MongoDB running locally (default: `mongodb://127.0.0.1:27017`)

## Setup

```bash
npm install
```

Create a `.env` file in the `backend` folder:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/smart_bank_queue
JWT_SECRET=use_a_long_random_value_here

ADMIN_NAME=Bank Admin
ADMIN_EMAIL=admin@smartbank.com
ADMIN_PASSWORD=choose_a_strong_password
```

Change `JWT_SECRET` and `ADMIN_PASSWORD` before showing or submitting the project.

## Run

```bash
npm start        # runs: node server.js
npm run dev      # runs: nodemon server.js (auto-restart on changes)
```

The API runs at `http://localhost:5000`. Expected console output:

```
MongoDB connected
Server running at http://localhost:5000
```

Restart the server after changing any backend file (when using `npm start`).

The frontend is served separately (for example with the VS Code Live Server extension). `frontend/js/api.js` sends all requests to `http://localhost:5000`.

## Folder Structure

```
backend/
  middleware/    authMiddleware.js (authMiddleware, staffOnly)
  models/        Customer, Service, Token, Counter, User
  routes/        API route files, one per group
  server.js      app entry point
  .env           environment settings (not shared)
  package.json
```

## Roles

| Role     | What they can do                                                     |
|----------|----------------------------------------------------------------------|
| Customer | Take a token, track it, cancel it, find it by mobile number (no login) |
| Staff    | Serve customers at their assigned counter (login required)            |
| Admin    | Manage services, counters and staff, view dashboard stats             |

## API Groups

| Base path        | Purpose                                         |
|------------------|-------------------------------------------------|
| `/api/customers` | Customer records (login required)               |
| `/api/services`  | Bank services (name, prefix, average time)      |
| `/api/tokens`    | Token generation, tracking, cancelling          |
| `/api/counters`  | Bank counters and the services each one handles |
| `/api/users`     | Staff and admin accounts                        |
| `/api/queue`     | Staff queue actions and dashboard statistics    |

Authenticated requests send the header `Authorization: Bearer <token>`.

### Tokens - `/api/tokens`

Public (used by the customer pages):

| Method | Path             | Description                                              |
|--------|------------------|----------------------------------------------------------|
| POST   | `/generate`      | Create a token. Body: `name`, `mobile`, `serviceId`, `priority` |
| GET    | `/:id/track`     | Status, customers ahead and estimated wait               |
| PUT    | `/:id/cancel`    | Cancel a token (only while status is Waiting)            |
| GET    | `/find/:mobile`  | Find today's active token by mobile number               |

Login required:

| Method | Path   | Description          |
|--------|--------|----------------------|
| GET    | `/`    | List all tokens      |
| GET    | `/:id` | Get one token        |
| PUT    | `/:id` | Update a token       |
| DELETE | `/:id` | Delete a token       |

Token numbers are built from the service prefix and a daily sequence (for example `A001`). Numbering restarts every day.

### Customers - `/api/customers`

All routes require login: `POST /`, `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id`.

### Queue - `/api/queue`

Staff routes (login as staff with an assigned counter):

| Method | Path                              | Description                                         |
|--------|-----------------------------------|-----------------------------------------------------|
| POST   | `/call-next/:counterId`           | Call the next waiting customer for this counter     |
| PUT    | `/start/:tokenId`                 | Start service (Called to Serving)                   |
| PUT    | `/complete/:tokenId`              | Complete service (Serving to Completed)             |
| PUT    | `/hold/:tokenId`                  | Put a serving customer on hold                      |
| PUT    | `/recall/:tokenId`                | Recall a held customer                              |
| PUT    | `/no-show/:tokenId`               | Mark a called customer as No Show                   |
| PUT    | `/transfer/:tokenId`              | Send a customer back to the queue for another counter |
| GET    | `/transfer-options/:tokenId`      | Other counters that support the token's service     |
| GET    | `/counter/:counterId/waiting`     | Waiting customers for this counter                  |
| GET    | `/counter/:counterId/current`     | Customer currently Called or Serving                |
| GET    | `/counter/:counterId/held`        | Customers on hold at this counter                   |
| GET    | `/counter-status`                 | Own counter number and status                       |
| PUT    | `/counter-status`                 | Set own counter to `Available` or `On Break`        |
| GET    | `/staff-stats`                    | Waiting, on hold, no show and completed counts      |

Admin dashboard:

| Method | Path            | Description                                        |
|--------|-----------------|----------------------------------------------------|
| GET    | `/stats/today`  | Total, waiting, serving and completed for today    |

### Services, Counters and Users

These routes are used by the admin pages and by login. See the files in `routes/` for the exact endpoints. `GET /api/services` is used by the customer page to list services.

## Queue Rules

1. **Priority first.** A lower priority number is called first (1 = Disabled/Pregnant, 2 = Senior Citizen, 3 = Normal). Customers with the same priority are served in order of arrival.
2. **Counters serve only their services.** Call Next picks only tokens whose service the counter supports.
3. **One customer at a time.** A counter cannot call another customer while one is Called or Serving.
4. **Break and Offline.** A counter that is On Break or Offline cannot call customers. Going on break is blocked while a customer is active.
5. **Transfer.** The destination counter must support the service and must not be Offline or On Break. The customer returns to the waiting list.
6. **Cancel.** Customers can cancel only while Waiting.

## Token Status Flow

```
Waiting -> Called -> Serving -> Completed
   |         |          |
   |         |          +-> On Hold -> Called (recall)
   |         +-> No Show
   +-> Cancelled
Called / Serving -> Waiting (transfer)
```

## Error Responses

Errors return JSON in this shape:

```json
{ "message": "Reason for the error" }
```

Common status codes: `400` invalid input, `401/403` not logged in or not allowed, `404` not found, `409` conflict (for example, a counter already has a customer), `500` server error.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Failed to fetch" on a page | The backend is not running. Run `npm start` and keep the terminal open. |
| `405` on login | The frontend is calling the Live Server port. Set `API_BASE` in `frontend/js/api.js` to `http://localhost:5000`. |
| Page shows `undefined` or `x.map is not a function` | The frontend calls a route that does not exist. Compare the request URL with `routes/`. |
| Server will not start | Check that MongoDB is running and `MONGO_URI` in `.env` is correct. |
| `EADDRINUSE` | Another server is already using port 5000. Close the extra terminal. |
| New route returns the home page | Restart the backend after editing route files. |