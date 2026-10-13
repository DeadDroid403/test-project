const form = document.querySelector('#login-form');
const message = document.querySelector('#message');
form.addEventListener('submit', async event => {
  event.preventDefault();
  message.textContent = 'Checking credentials...';
  const response = await fetch('/api/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username.value, password: password.value })
  });
  const data = await response.json();
  if (!response.ok) { message.textContent = data.error + '\n\nDebug query:\n' + data.query; return; }
  // if (!response.ok) { message.textContent = data.error; return; }
  // Intentional insecure design: the claimed user is kept in localStorage and trusted by the app.
  localStorage.setItem('vuln-notes-user', data.user.username);
  location.href = '/notes.html';
});
