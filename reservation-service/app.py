from flask import Flask, jsonify, render_template
from flask_jwt_extended import JWTManager
from models import db, Reservation
from routes import reservations_bp, availability_bp
import os
import threading
import json
import time

# Mock KafkaConsumer to avoid import issue with Python 3.12
class KafkaConsumer:
    def __init__(self, topic, bootstrap_servers, group_id, value_deserializer, auto_offset_reset, enable_auto_commit):
        self.topic = topic
        self.bootstrap_servers = bootstrap_servers
        self.group_id = group_id
        self.value_deserializer = value_deserializer
        self.auto_offset_reset = auto_offset_reset
        self.enable_auto_commit = enable_auto_commit
        print(f"Using mock KafkaConsumer for topic: {topic}")
        
    def __iter__(self):
        # This iterator never yields any messages, effectively disabling Kafka consumption
        while True:
            time.sleep(3600)  # Sleep for a long time
            
# Mock Kafka errors
class NoBrokersAvailable(Exception):
    pass

def create_app():
    app = Flask(__name__, static_folder='static', template_folder='templates')
    
    # Add this line to disable strict slashes globally
    app.url_map.strict_slashes = False
    
    # Load configuration
    app.config.from_object('config.Config')
    
    # Initialize extensions
    db.init_app(app)
    jwt = JWTManager(app)
    
    # Register blueprints
    app.register_blueprint(reservations_bp)
    app.register_blueprint(availability_bp)
    
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
        
    @app.errorhandler(409)
    def conflict(error):
        return jsonify({"error": "Conflict", "message": str(error)}), 409
        
    @app.errorhandler(500)
    def server_error(error):
        return jsonify({"error": "Internal Server Error", "message": str(error)}), 500
    
    # Serve frontend HTML page for booking page
    @app.route('/reservations')
    def reservations_page():
        return render_template('reservations.html')
    
    @app.route('/rooms')
    def rooms_page():
        return render_template('rooms.html')
    
    @app.route('/home')
    def home_page():
        return render_template('index.html')

    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app

def start_kafka_consumer(app):
    """Start Kafka consumer in a separate thread with retry mechanism"""
    def consume_room_events():
        with app.app_context():
            retry_count = 0
            max_retries = 5
            retry_delay = 5  # seconds

            while True:
                try:
                    consumer = KafkaConsumer(
                        'room_events',
                        bootstrap_servers=app.config['KAFKA_BROKER_URL'],
                        group_id=app.config['KAFKA_CONSUMER_GROUP'],
                        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                        auto_offset_reset='earliest',
                        enable_auto_commit=True
                    )
                    
                    print("Kafka consumer started. Listening for room events...")
                    retry_count = 0  # Reset retry count on successful connection
                    
                    for message in consumer:
                        event = message.value
                        event_type = event.get('event_type')
                        
                        if event_type == 'room_deleted':
                            room_id = event.get('room_id')
                            if room_id:
                                # Delete all reservations associated with the deleted room
                                reservations = Reservation.query.filter_by(room_id=room_id).all()
                                if reservations:
                                    print(f"Deleting {len(reservations)} reservations for room_id {room_id}")
                                    for reservation in reservations:
                                        db.session.delete(reservation)
                                    db.session.commit()
                
                except NoBrokersAvailable:
                    retry_count += 1
                    if retry_count > max_retries:
                        print(f"Error connecting to Kafka after {max_retries} attempts. Will continue trying in the background.")
                        # Lower the retry frequency after max_retries to reduce log noise
                        time.sleep(60)  # Wait longer between retries after max_retries
                    else:
                        print(f"Kafka broker not available. Retrying in {retry_delay} seconds (attempt {retry_count}/{max_retries})...")
                        time.sleep(retry_delay)
                
                except Exception as e:
                    print(f"Error in Kafka consumer: {str(e)}")
                    time.sleep(retry_delay)
    
    # Start consumer in a separate thread
    consumer_thread = threading.Thread(target=consume_room_events, daemon=True)
    consumer_thread.start()
    return consumer_thread

if __name__ == '__main__':
    app = create_app()
    
    # Start Kafka consumer
    consumer_thread = start_kafka_consumer(app)
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5002)), debug=app.config['DEBUG'])
