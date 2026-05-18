# API Documentation

FastAPI exposes interactive Swagger documentation at `/docs`.

## Auth

### `POST /api/auth/register`

Registers a user.

```json
{
  "email": "doctor@example.com",
  "password": "StrongPassword123",
  "full_name": "Dr. Demo"
}
```

### `POST /api/auth/login`

Returns a bearer token.

## Prescriptions

### `POST /api/prescriptions/process`

Multipart form upload:

- `file`: image or PDF
- `language_hint`: optional `en`, `hi`, or `mr`

Returns structured prescription JSON.

### `GET /api/prescriptions`

Returns prescription history.

### `GET /api/prescriptions/{id}`

Returns one prescription.

### `GET /api/prescriptions/{id}/export/json`

Downloads extracted data as JSON.

### `GET /api/prescriptions/{id}/export/pdf`

Downloads a verification-ready PDF summary.

