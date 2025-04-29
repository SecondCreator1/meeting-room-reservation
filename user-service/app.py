from flask import Flask, jsonify, send_from_directory, redirect, url_for
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from models import db, User
from routes import auth_bp, user_bp
import os

def create_app():
    app = Flask(__name__, static_folder='../frontend')  # Serving static files from frontend folder
    
    # Load configuration
    app.config.from_object('config.Config')
    
    # Initialize extensions
    db.init_app(app)
    jwt = JWTManager(app)
    
    # JWT error handlers
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            "error": "Invalid token",
            "message": "The token provided is invalid or malformed."
        }), 401
        
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            "error": "Authorization required",
            "message": "Request does not contain a valid token."
        }), 401
        
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            "error": "Token expired",
            "message": "The token has expired. Please log in again."
        }), 401
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    
    # Serve frontend files for specific routes
    @app.route('/')
    def home():
        return send_from_directory(app.static_folder, 'index.html')
    
    @app.route('/rooms')
    @jwt_required()
    def rooms():
        # Ensure user is authorized to view rooms
        current_user = get_jwt_identity()
        user = User.query.filter_by(id=current_user).first()
        if user.role != 'admin':  # Only allow access if user is admin
            return jsonify({"error": "Forbidden", "message": "You don't have permission to access rooms."}), 403
        return send_from_directory(app.static_folder, 'rooms/rooms.html')

    @app.route('/reservations')
    @jwt_required()
    def reservations():
        # Ensure user is authorized to view reservations
        current_user = get_jwt_identity()
        user = User.query.filter_by(id=current_user).first()
        if user.role != 'user' and user.role != 'admin':  # Allow users and admins to access
            return jsonify({"error": "Forbidden", "message": "You don't have permission to view your bookings."}), 403
        return send_from_directory(app.static_folder, 'reservations/reservations.html')

    # Error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"error": "Bad Request", "message": str(error)}), 400
        
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({"error": "Unauthorized", "message": str(error)}), 401
        
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({"error": "Forbidden", "message": str(error)}), 403
        
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not Found", "message": str(error)}), 404
        
    @app.errorhandler(500)
    def server_error(error):
        return jsonify({"error": "Internal Server Error", "message": str(error)}), 500
    
    @app.errorhandler(422)
    def unprocessable_entity(error):
        return jsonify({"error": "Unprocessable Entity", "message": str(error)}), 422
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)), debug=app.config['DEBUG'])
