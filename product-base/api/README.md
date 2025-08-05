# API

Simple Node.js and SQLite API providing signup, login, random number generation and statistics.

## Local Setup

Install dependencies and start the server:

```bash
npm install
npm start
```

The API listens on `http://localhost:4000` and stores its data in `database.sqlite` in this folder.

## Endpoints

### `POST /signup`
Request:
```json
{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret",
  "address": "1 Main St",
  "city": "Townsville",
  "state": "CA",
  "zip_code": "12345",
  "birthday": "01/01/2000"
}
```
Response:
```json
{ "id": 1 }
```

### `POST /login`
Request:
```json
{ "email": "jane@example.com", "password": "secret" }
```
Response:
```json
{
  "id": 1,
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "address": "1 Main St",
  "city": "Townsville",
  "state": "CA",
  "zip_code": "12345",
  "birthday": "01/01/2000"
}
```

### `GET /rng`
Headers:
```
rng-user-id: <user id>
```
Response:
```json
{ "number": 1234, "created_at": "2024-01-01T00:00:00.000Z" }
```

### `GET /stats`
Headers:
```
rng-user-id: <user id>
```
Response:
```json
{ "totalNumbersGenerated": 42, "bestNumber": 9999 }
```

### `GET /numbers`
Headers:
```
rng-user-id: <user id>
```
Query parameters: `page` (default `1`) and `limit` (default `25`, max `100`).
Response:
```json
{
  "numbers": [
    { "id": 1, "value": 1234, "created_at": "2024-01-01T00:00:00.000Z" }
  ],
  "page": 1,
  "totalPages": 1,
  "next": null
}
```

### `POST /update-profile`
Headers:
```
rng-user-id: <user id>
```
Request:
```json
{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "address": "1 Main St",
  "city": "Townsville",
  "state": "CA",
  "zip_code": "12345",
  "birthday": "01/01/2000"
}
```
Response: same as request body with the user `id`.
