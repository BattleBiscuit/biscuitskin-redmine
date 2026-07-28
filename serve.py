#!/usr/bin/env python3
"""Dev server for the userscripts.

Serves this directory over HTTP with caching fully disabled, so Tampermonkey
picks up edits immediately instead of waiting on GitHub's raw CDN (which sends
Cache-Control: max-age=300). Use the localhost URLs for iteration; push to
GitHub when a change is worth keeping.

    python3 serve.py [port]      # default port 8765
"""

import http.server
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        # Tampermonkey fetches the update/download URL cross-origin.
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def guess_type(self, path):
        # .user.js must arrive as JavaScript for Tampermonkey to offer install.
        if path.endswith(".user.js"):
            return "text/javascript"
        return super().guess_type(path)


class ReusableServer(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    with ReusableServer(("0.0.0.0", PORT), NoCacheHandler) as httpd:
        print(f"serving {PORT} with caching disabled - ctrl+c to stop")
        httpd.serve_forever()
