#! /usr/bin/env nix-shell
#! nix-shell -i python3 -p python3Packages.websockets

import asyncio
import websockets
import signal
import os
import json


chatlog = ""
open_sockets = set()
chatlog_max_size = 1000


async def main():
    loop = asyncio.get_running_loop()
    stop = loop.create_future()
    loop.add_signal_handler(signal.SIGTERM, stop.set_result, None)
    host = "localhost"
    port = int(os.environ.get("PORT", "8001"))
    async with websockets.serve(on_connection, host, port):
        print("Serving.")
        await stop


async def on_connection(socket):
    global chatlog, open_sockets, chatlog_max_size
    chatcounter = 0  # counts characters from client that are in the chatlog
    print(f"Connection {socket}")
    print(f"Number of connections: {len(open_sockets)}")
    await socket.send(chatlog)
    open_sockets.add(socket)
    try:
        async for message in socket:
            print(f"Message from: {socket}")
            print(f"Message contains: {message!r}")
            chatcounter += len(message)
            chatlog += message
            if chatlog_max_size < len(chatlog):
                chatlog = chatlog[-chatlog_max_size//2:]
            asyncio.create_task(websocket.send(json.dumps({"chatcounter": chatcounter})))  # notify the client that it's changes are included
            websockets.broadcast(open_sockets, json.dumps({"chatlog": chatlog}))
    except Exception as e:
        print(e)
    finally:
        print(f"Closed socket {socket}")
        open_sockets.remove(socket)

try:
    asyncio.run(main())
except KeyboardInterrupt:
        print("Quit because of KeyboardInterrupt.")

"""
Improvement:
    when sending chatlog, include how much of the users input is in it
    that way, when the users gets the chatlog, it can see if anything has been typed that isnt in the chatlog
"""
