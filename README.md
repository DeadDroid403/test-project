# Beginner SSTI CTF Challenge

A deliberately vulnerable two-page Flask/Jinja application for a local CTF or training lab: a secure login gate in front of a vulnerable home page.

> **Warning:** The home page is intentionally insecure (Server-Side Template Injection). Run it only in an isolated lab environment. Do not expose it directly to the public internet.

## Challenge story

The app has a login page and a "Notepad" home page. Authentication is solid — there is no registration, a single hardcoded account, a salted password hash, constant-time checks, and a hardened session cookie, so you cannot bypass the login. Once signed in, however, the home page renders your note by treating it as part of a Jinja template.

**Credentials (provided to players):**

```text
username: player
password: passwd123
```

**Goal:** Log in, then retrieve the flag via the note field.

## Run with Docker Compose

```bash
docker compose up --build
```

Open:

```text
http://localhost:5000
```

Stop the challenge:

```bash
docker compose down
```

## Run with Docker only

```bash
docker build -t beginner-ssti-ctf .
docker run --rm -p 5000:5000 \
  -e 'FLAG=CTF{replace_with_your_flag}' \
  beginner-ssti-ctf
```

## Custom flag

Change the `FLAG` value in `docker-compose.yml`, or supply it as an environment variable when using `docker run`.

## Beginner hints

1. Log in first with `player` / `passwd123`. The login itself is not the vulnerability.
2. Jinja expressions use double curly braces.
3. On the home page, test whether arithmetic is evaluated in the note field, for example: `{{ 7 * 7 }}`
4. A variable named `flag` is available inside the vulnerable template.

## Organizer solution

Log in, then submit this as the note:

```jinja2
{{ flag }}
```

The home page will render the configured flag.

## Vulnerable code

Authentication and authorization are secure. The vulnerability is only in the authenticated home handler in `app.py`:

```python
template = f'<p class="note-body">{note}</p>'
rendered = render_template_string(template, flag=FLAG)
```

The application inserts untrusted input into a template string and then renders the result. In a real application, pass user input as template data instead of compiling it as template source.

## Authentication notes

- No database and no registration — a single account defined by `CTF_USERNAME` / `CTF_PASSWORD`.
- The password is stored as a salted hash (`werkzeug.security`), verified with a constant-time check.
- The home page and logout require a valid session; unauthenticated requests are redirected to the login page.
- Session cookies are `HttpOnly` and `SameSite=Lax`. Set `SESSION_COOKIE_SECURE=1` when serving over HTTPS, and set a fixed `SECRET_KEY` for stable sessions.
