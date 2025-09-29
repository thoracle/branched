#!/usr/bin/env python3
"""
BranchEd Server - Serves the story editor with game data access
"""

import os
import json
import signal
import sys
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.parse

class BranchEdHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Set the directory to serve from
        super().__init__(*args, directory="static", **kwargs)

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)

        # Handle favicon specially
        if parsed_path.path == '/favicon.ico':
            favicon_path = Path(__file__).parent.parent / "favicon.ico"
            if favicon_path.exists():
                self.send_response(200)
                self.send_header('Content-type', 'image/x-icon')
                self.end_headers()
                with open(favicon_path, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_error(404, "Favicon not found")
            return

        # Handle API endpoints
        if parsed_path.path == '/api/games':
            self.send_games_list()
        elif parsed_path.path.startswith('/api/game/'):
            self.send_game_data(parsed_path.path)
        else:
            # Serve static files
            super().do_GET()

    def send_games_list(self):
        """List all games in the ../games/ directory"""
        games_dir = Path(__file__).parent.parent / "games"
        games = []

        if games_dir.exists():
            for game_dir in games_dir.iterdir():
                if game_dir.is_dir():
                    config_file = game_dir / "game_config.json"
                    if config_file.exists():
                        try:
                            with open(config_file, 'r') as f:
                                config = json.load(f)
                                games.append({
                                    'id': game_dir.name,
                                    'name': config.get('title', config.get('game_name', game_dir.name)),
                                    'version': config.get('version', 'Unknown'),
                                    'path': str(game_dir.relative_to(games_dir.parent))
                                })
                        except Exception as e:
                            print(f"Error reading {config_file}: {e}")

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(games).encode())

    def send_game_data(self, path):
        """Send game configuration and data files"""
        game_id = path.split('/')[-1]
        games_dir = Path(__file__).parent.parent / "games" / game_id

        if not games_dir.exists():
            self.send_error(404, "Game not found")
            return

        game_data = {
            'id': game_id,
            'config': None,
            'storyContent': None,
            'files': []
        }

        # Read game config
        config_file = games_dir / "game_config.json"
        if config_file.exists():
            with open(config_file, 'r') as f:
                game_data['config'] = json.load(f)

            # Read the story file if specified
            story_file_path = game_data['config'].get('story_settings', {}).get('main_story_file')
            if story_file_path:
                # Handle both absolute and relative paths
                if story_file_path.startswith('data/'):
                    story_file_path = story_file_path[5:]  # Remove 'data/' prefix

                story_file = games_dir / story_file_path
                if story_file.exists() and story_file.suffix == '.twee':
                    with open(story_file, 'r', encoding='utf-8') as f:
                        game_data['storyContent'] = f.read()

        # List available data files
        for file_path in games_dir.glob("*.json"):
            game_data['files'].append(file_path.name)

        for file_path in games_dir.glob("*.twee"):
            game_data['files'].append(file_path.name)

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(game_data).encode())

def run_server(port=8000):
    server_address = ('', port)
    httpd = HTTPServer(server_address, BranchEdHandler)

    # Set up signal handler for immediate shutdown
    def signal_handler(signum, frame):
        print("\n\nShutting down server...")
        httpd.server_close()
        print("Server stopped.")
        sys.exit(0)

    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)  # Ctrl+C
    signal.signal(signal.SIGTERM, signal_handler)  # Termination signal

    print(f"BranchEd Server running on http://localhost:{port}")
    print(f"Serving from: {Path(__file__).parent / 'static'}")
    print(f"Games directory: {Path(__file__).parent.parent / 'games'}")
    print("Press Ctrl+C to stop the server")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        # This should be caught by signal handler, but just in case
        print("\n\nShutting down server...")
        httpd.shutdown()
        httpd.server_close()
        print("Server stopped.")
        return 0
    except Exception as e:
        print(f"\nError: {e}")
        httpd.shutdown()
        httpd.server_close()
        return 1

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    exit_code = run_server(port)
    sys.exit(exit_code if exit_code is not None else 0)