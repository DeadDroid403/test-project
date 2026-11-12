# Safe comparison

A safe implementation keeps user input as data:

```python
return render_template("welcome.html", username=username)
```

And the template contains:

```jinja2
<h1>Hello, {{ username }}!</h1>
```

Jinja autoescaping then treats the username as content rather than new template source.
