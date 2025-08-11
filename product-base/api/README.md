# API

Simple Node.js and SQLite API providing signup, login, random number generation and statistics.

## Local Setup

Install dependencies and start the server:

```bash
npm install
npm start
```

The API listens on `http://localhost:4000` and stores its data in `database.sqlite` in this folder.

### Environment variables

For local development, copy `.env.example` to `.env` and provide the required
values:

```
cp .env.example .env
```

The following variables are used to optionally sync the SQLite database with an
S3 bucket:

- `AWS_REGION` – AWS region of the bucket
- `S3_BUCKET` – bucket name where the SQLite file is stored
- `S3_DB_KEY` – object key inside the bucket (defaults to `database.sqlite`)

When a database file exists locally on startup, the server skips downloading
the object from S3. On shutdown, the database is uploaded back to the original
key and also archived under `archive/{day-month-year}/{time-in-utc}-database.sqlite`
inside the same bucket to allow version recovery.

To test S3 locally, obtain temporary AWS credentials (access key ID, secret, and
session token) from your [access landing page](https://lucra-sports.awsapps.com/start/#/?tab=accounts).
These credentials require read and write access to the `dev` account and should
be exported as `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and
`AWS_SESSION_TOKEN` before starting the server.

If these variables are missing or the S3 object does not exist, the API falls
back to creating a local SQLite database. Remember to set equivalent environment
variables in the Elastic Beanstalk instance so it can persist and restore the
database. **TODO: configure the above variables in the EB environment.**

## Deployment

To deploy the API to Elastic Beanstalk:

1. Create a ZIP archive containing the following files from this directory:
   - `database.js`
   - `logger.js`
   - `server.js`
   - `package.json`
   - `package-lock.json`
2. Upload the ZIP to the [Elastic Beanstalk environment](https://us-east-1.console.aws.amazon.com/elasticbeanstalk/home?region=us-east-1#/environment/dashboard?applicationName=RNG&environmentId=e-cvttx5qcta).

Elastic Beanstalk will install dependencies and start the server automatically.

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
