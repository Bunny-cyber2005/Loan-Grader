"""
Quick local web server for the Loan Grader website.
Required because browsers block fetch() on file:// URLs (CORS).

Run:
    python serve.py

Then open: http://localhost:8080
"""
import http.server, socketserver, os

PORT = 8080
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Allow ONNX/WASM files to load
        self.send_header('Cross-Origin-Opener-Policy',   'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        super().end_headers()
    def log_message(self, fmt, *args):
        print(f"  {args[0]} {args[1]}")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"\n  Loan Grader website running at http://localhost:{PORT}")
    print(f"  Press Ctrl+C to stop\n")
    httpd.serve_forever()
