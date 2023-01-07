#! /usr/bin/env nix-shell
#! nix-shell -i python3 -p python3Packages.websockets

import asyncio
import websockets

chatlog = ""
open_sockets = set()
chatlog_max_size = 1000


async def main():
    async with websockets.serve(on_connection, "localhost", 6789):
        print("Serving.")
        await asyncio.Future()  # run forever


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
