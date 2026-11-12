import hmac
import os
from functools import wraps

from flask import (
    Flask,
    redirect,
    render_template,
    render_template_string,
    request,
    session,
    url_for,
)
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)

# Session signing key. Supply a fixed SECRET_KEY in the environment for a
# stable deployment; otherwise a fresh random key is generated per start
# (which simply invalidates existing sessions on restart).
app.secret_key = os.environ.get("SECRET_KEY") or os.urandom(32)

# Harden the session cookie. SECURE is only enabled when the challenge is
# served over HTTPS (set SESSION_COOKIE_SECURE=1 behind a TLS proxy).
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.environ.get("SESSION_COOKIE_SECURE") == "1",
)

FLAG = os.environ.get("FLAG", "CTF{beginner_ssti_success}")

# The one and only account. No database, no registration.
# The password is stored as a salted hash, not in plaintext.
VALID_USERNAME = os.environ.get("CTF_USERNAME", "player")
PASSWORD_HASH = generate_password_hash(
    os.environ.get("CTF_PASSWORD", "passwd123")
)


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get("authenticated"):
            return redirect(url_for("login"))
        return view(*args, **kwargs)

    return wrapped


@app.get("/login")
def login():
    if session.get("authenticated"):
        return redirect(url_for("home"))
    return render_template("login.html")


@app.post("/login")
def do_login():
    username = request.form.get("username", "")
    password = request.form.get("password", "")

    # Constant-time username check + hashed password verification.
    username_ok = hmac.compare_digest(username, VALID_USERNAME)
    password_ok = check_password_hash(PASSWORD_HASH, password)

    if username_ok and password_ok:
        session.clear()
        session["authenticated"] = True
        session["username"] = VALID_USERNAME
        return redirect(url_for("home"))

    return render_template("login.html", error="Invalid username or password."), 401


@app.post("/logout")
@login_required
def logout():
    session.clear()
    return redirect(url_for("login"))


@app.route("/", methods=["GET", "POST"])
@login_required
def home():
    username = session.get("username", "player")
    rendered = None

    if request.method == "POST":
        note = request.form.get("note", "")

        # Intentionally vulnerable for this CTF challenge:
        # authenticated user input is inserted into a Jinja template string
        # and then rendered. The flag is exposed to the template context so
        # the beginner payload {{ flag }} solves the challenge.
        template = f"""
        <div class="note-output">
          <p class="note-label">Your note:</p>
          <p class="note-body">{note}</p>
        </div>
        """
        rendered = render_template_string(template, flag=FLAG)

    return render_template("home.html", username=username, rendered=rendered)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
