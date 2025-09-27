from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
from twee import TweeParser, TweeExporter

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/')
def index():
    return send_from_directory('../static', 'index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('../static', path)

@app.route('/api/import', methods=['POST'])
def import_twee():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        content = file.read().decode('utf-8')
        parser = TweeParser()
        data = parser.parse(content)

        return jsonify(data)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export', methods=['POST'])
def export_twee():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        exporter = TweeExporter()
        twee_content = exporter.export(data)

        return jsonify({'content': twee_content})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/save', methods=['POST'])
def save_project():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        project_id = data.get('id', 'default')
        filepath = os.path.join(UPLOAD_FOLDER, f'{project_id}.json')

        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)

        return jsonify({'success': True, 'id': project_id})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/load/<project_id>', methods=['GET'])
def load_project(project_id):
    try:
        filepath = os.path.join(UPLOAD_FOLDER, f'{project_id}.json')

        if not os.path.exists(filepath):
            return jsonify({'error': 'Project not found'}), 404

        with open(filepath, 'r') as f:
            data = json.load(f)

        return jsonify(data)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)