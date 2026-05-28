from flask import Flask, request, jsonify, render_template, send_from_directory
from datetime import datetime, timezone
from threading import Lock
import json, os

app = Flask(__name__)
lock = Lock()

DATA_FILE  = os.path.join(os.path.dirname(__file__), 'tracker_data.json')
LOG_FILE   = os.path.join(os.path.dirname(__file__), 'tracker_history.json')
MAX_HISTORY = 500

# In-memory state — survives requests, lost on restart
state = {
    'lat': None, 'lng': None, 'alt': None,
    'sats': 0, 'timestamp': 0,
    'find': False, 'alert': False,
    'last_seen': None,
}
history = []


def load_from_disk():
    global state, history
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE) as f:
                state.update(json.load(f))
        except Exception:
            pass
    if os.path.exists(LOG_FILE):
        try:
            with open(LOG_FILE) as f:
                history = json.load(f)
        except Exception:
            pass


def persist_state():
    try:
        with open(DATA_FILE, 'w') as f:
            json.dump(state, f)
    except Exception:
        pass


def persist_history():
    try:
        with open(LOG_FILE, 'w') as f:
            json.dump(history[-MAX_HISTORY:], f)
    except Exception:
        pass


load_from_disk()


# ── Routes ──────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/data', methods=['POST'])
def receive_data():
    """ESP32 POSTs GPS data here every N seconds.
    Response tells the device whether to buzz (find flag)."""
    body = request.get_json(force=True, silent=True) or {}

    with lock:
        now = datetime.now(timezone.utc).isoformat()

        # Always update heartbeat fields
        state['sats']      = int(body.get('sats', 0))
        state['timestamp'] = int(body.get('timestamp', 0))
        state['last_seen'] = now

        # Only update location if ESP32 has a GPS fix
        has_fix = body.get('lat') is not None and not body.get('nofix', False)
        if has_fix:
            state['lat'] = body['lat']
            state['lng'] = body['lng']
            state['alt'] = round(float(body.get('alt', 0)), 1)

        persist_state()

        if has_fix:
            history.append({
                'lat':         state['lat'],
                'lng':         state['lng'],
                'alt':         state['alt'],
                'sats':        state['sats'],
                'recorded_at': now,
            })
            if len(history) > MAX_HISTORY:
                history.pop(0)
            persist_history()

        return jsonify({
            'ok':    True,
            'find':  state['find'],
            'alert': state['alert'],
        })


@app.route('/api/status')
def get_status():
    """Dashboard polls this every 2 seconds."""
    with lock:
        return jsonify(state)


@app.route('/api/find', methods=['POST'])
def set_find():
    """Dashboard sets the find flag (true = buzz the device)."""
    body = request.get_json(force=True, silent=True) or {}
    with lock:
        state['find'] = bool(body.get('active', False))
        persist_state()
        return jsonify({'ok': True, 'find': state['find']})


@app.route('/api/history')
def get_history():
    """Returns last 100 history entries (newest first)."""
    with lock:
        return jsonify(list(reversed(history[-100:])))


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
