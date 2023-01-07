#! /usr/bin/env nix-shell
#! nix-shell -i python3 -p python3Packages.websockets

import asyncio
import websockets
import signal
import os

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
    print(f"Connection {socket}")
    await socket.send(chatlog)
    open_sockets.add(socket)
    try:
        async for message in socket:
            print(f"Message. {message}")
            chatlog += message
            if chatlog_max_size < len(chatlog):
                chatlog = chatlog[-chatlog_max_size//2:]
            websockets.broadcast(open_sockets, chatlog)
    except Exception as e:
        print(e)
    finally:
        print(f"Closed socket {socket}")
        open_sockets.remove(socket)

try:
    asyncio.run(main())
except KeyboardInterrupt:
        print("Quit because of KeyboardInterrupt.")
