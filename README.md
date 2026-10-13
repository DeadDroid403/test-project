# Vuln Notes CTF

Intentionally insecure local practice target. Do **not** deploy it publicly or use real credentials.

Run it with:

```sh
docker compose up --build
```

Open `http://localhost:3000`.

The lab deliberately includes SQL injection in login and insecure-design flaws
(client-controlled identity/no authorization). Notes are held only in RAM.

## CORS status

CORS vulnerability is **active**. The server reflects any `Origin` header back in
`Access-Control-Allow-Origin` and sets `Access-Control-Allow-Credentials: true`,
allowing any cross-origin page to make credentialed requests and read API responses.
