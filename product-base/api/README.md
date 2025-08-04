# API

Simple Node.js and SQLite API providing signup, login, random number generation and statistics.

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Start the server

```bash
npm start
```

The API listens on `http://localhost:3000` and stores its data in `database.sqlite` in this folder.

## Endpoints

### POST /signup
Create a new user.

Body fields: `full_name`, `email`, `password`, `address`, `city`, `state`, `zip_code`, `birthday` (mm/dd/yyyy)

Response: `{ id }` or error if the email already exists.

### POST /login
Authenticate a user.

Body fields: `email`, `password`

Response: user model without password.

### GET /rng
Generate a random number between 1 and 10,000.

Header: `rng-user-id` containing the caller's user id.

Response: `{ number }`. The generated number is stored for the user.

### GET /stats
Return statistics for the authenticated user.

Header: `rng-user-id`

Response: `{ totalNumbersGenerated, bestNumber }`

### POST /update-profile
Update profile information for the authenticated user.

Header: `rng-user-id`

Body fields: `full_name`, `email`, `address`, `city`, `state`, `zip_code`, `birthday`

Response: updated user model.
