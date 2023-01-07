#! /usr/bin/env nix-shell
#! nix-shell -i python3 -p python3Packages.flask

from flask import Flask, send_from_directory, redirect, request

app = Flask(__name__)

file_max_size = 100

f = open('chatbox.txt', 'r+b')

@app.route("/hello")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route('/static/<path:path>')
def mystatic(path):
    return send_from_directory('static', path)

@app.route('/index.html')
def myindex():
    return redirect('static/index.html')

@app.route('/chatbox.txt', methods=['POST'])
def mychatbox_post():
    # f = open('chatbox.txt', 'r+b')
    f.seek(0)
    start_text = f.read()
    full_text = start_text + request.data
    if file_max_size < len(full_text):
        full_text = full_text[-file_max_size//2:]
        f.seek(0)
        f.truncate(0)
        f.write(full_text)
    else:
        f.write(request.data)
    return full_text

@app.route('/chatbox.txt', methods=['GET'])
def mychatbox_get():
    # f = open('chatbox.txt', 'rb')
    f.seek(0)
    return f.read()
