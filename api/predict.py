"""POST /api/predict — score an ad-hoc customer payload.

Body JSON: {
  "tickets_90d": int, "open_tickets": int, "failed_payments_180d": int,
  "usage_delta": int, "logins_60d": int, "plan_rank": int, "mrr_dollars": float
}
"""
from http.server import BaseHTTPRequestHandler
import json, os, joblib
from pathlib import Path

MODEL_PATH = Path(os.environ.get("CHURN_MODEL_PATH", "public/model/churn_model.joblib"))
_BUNDLE = joblib.load(MODEL_PATH) if MODEL_PATH.exists() else None

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("content-length", 0))
        payload = json.loads(self.rfile.read(length) or b"{}")
        if _BUNDLE is None:
            return self._json(503, {"error": "model not available"})
        feats = _BUNDLE["features"]
        try:
            x = [[float(payload[f]) for f in feats]]
        except KeyError as e:
            return self._json(400, {"error": f"missing feature {e.args[0]}"})
        prob = float(_BUNDLE["pipeline"].predict_proba(x)[0, 1])
        return self._json(200, {"churnProb": prob})

    def _json(self, status, body):
        self.send_response(status)
        self.send_header("content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(body).encode("utf-8"))
