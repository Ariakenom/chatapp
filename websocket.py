#! /usr/bin/env nix-shell
#! nix-shell -i python3 -p python3Packages.websockets

import asyncio
import websockets

chatlog = ""
open_sockets = set()  # some id to something that can make some asyncio happen
chatlog_max_size = 50

async def echo(socket):
    async for message in socket:
        await socket.send(message)


async def main():
    async with websockets.serve(echo, "localhost", 6789):
        await asyncio.Future()  # run forever


async def main2():
    async with websockets.serve(on_connection, "localhost", 6789):
        await asyncio.Future()  # run forever


async def on_connection(socket):
    global chatlog, open_sockets, chatlog_max_size
    socket.send(chatlog)
    open_sockets.add(socket)
    try:
        async for message in socket:
            chatlog += message
            if chatlog_max_size < len(chatlog):
                chatlog = chatlog[-chatlog_max_size//2:]
            websockets.broadcast(open_sockets, chatlog)
    finally:
        open_sockets.remove(socket)


asyncio.run(main())
