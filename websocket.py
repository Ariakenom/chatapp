#! /usr/bin/env nix-shell
#! nix-shell -i python3 -p python3Packages.websockets

import asyncio
import websockets
import signal
import os
import json


open_sockets = set()


async def main():
    loop = asyncio.get_running_loop()
    stop = loop.create_future()
    loop.add_signal_handler(signal.SIGTERM, stop.set_result, None)
    loop.add_signal_handler(signal.SIGINT, stop.set_result, None)
    host = ""
    port = int(os.environ.get("PORT", "8001"))
    async with websockets.serve(on_connection, host, port):
        print(f"Serving host={host} port={port}.")
        await stop
    print("\nClean shutdown.")


async def on_connection(socket):
    global open_sockets
    chatcounter = 0  # counts characters from client that are in the chatlog
    open_sockets.add(socket)
    print(f"Connection {socket}")
    print(f"Number of connections: {len(open_sockets)}")
    try:
        async for message in socket:
            print(f"Message from: {socket}")
            print(f"Message contains: {message!r}")
            chatcounter += len(message)
            websockets.broadcast(open_sockets-{socket}, json.dumps({"chatmessage": message}))
            asyncio.create_task(socket.send(json.dumps({"chatcounter": chatcounter, "chatmessage": message})))  # notify the client that it's changes are included
    except Exception as e:
        print(e)
    finally:
        print(f"Closed socket {socket}")
        open_sockets.remove(socket)


def drop_privileges(uid_name='nobody', gid_name='nogroup'):
    if os.getuid() != 0:
        # We're not root so, like, whatever dude
        return
    running_uid = pwd.getpwnam(uid_name).pw_uid
    running_gid = grp.getgrnam(gid_name).gr_gid

    # Remove group privileges
    os.setgroups([])

    os.setgid(running_gid)
    os.setuid(running_uid)

    # Ensure a very conservative umask
    old_umask = os.umask(0o077)


drop_privileges()
asyncio.run(main())

