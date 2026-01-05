from flask import Flask, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

# CORS Security: Allow only React frontend (port 3000)
CORS(app, origins=["http://localhost:3000", "https://feed-back-survey-frontend.onrender.com"])

mongo = PyMongo(app)

# --- Global Error Handling ---
@app.errorhandler(400)
def bad_request(e):
    # Returns a JSON error instead of HTML
    return jsonify({"error": "Invalid request", "details": str(e.description)}), 400

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(403)
def forbidden(e):
    return jsonify({"error": "Access forbidden"}), 403

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500

# --- Register Blueprints (Routes) ---
from routes.auth import auth_bp
from routes.survey import survey_bp
from routes.public import public_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(survey_bp, url_prefix='/api/surveys')
app.register_blueprint(public_bp, url_prefix='/api/public')

if __name__ == '__main__':
    app.run(debug=True, port=5000)