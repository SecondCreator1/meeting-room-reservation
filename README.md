# Meeting Room Reservation System API

# Meeting Room Reservation System

This project is a Meeting Room Reservation System that allows users to book and manage meeting rooms. It is designed for easy reservation and management of available meeting rooms for businesses, schools, or any organizations that need a simple and effective way to handle meeting room reservations.

## Features

- User authentication (login/signup)
- Reservation of meeting rooms
- View available rooms
- View current reservations
- Admin functionality to manage rooms and reservations
- Real-time reservation updates

## Architecture

This system is composed of three microservices:

- **User Service**: Handles authentication and user management
- **Room Service**: Manages room resources and their attributes
- **Reservation Service**: Handles room booking and availability

### Technology Stack
-**Frontend**: HTML , CSS , JS
- **Backend**: Python Flask
- **Database**: PostgreSQL
- **Message Broker**: Apache Kafka
- **Authentication**: OAuth 2.0 with JWT
- **Containerization**: Docker,K8S

## Prerequisites

- Python 3.8+
- PostgreSQL 12+
- Docker and Docker Compose
- Apache Kafka

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/SecondCreator1/meeting-room-reservation.git
cd meeting-room-reservation
```

```

### 2. Install Python Dependencies

```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies for each service
pip install -r user-service/requirements.txt
pip install -r room-service/requirements.txt
pip install -r reservation-service/requirements.txt
```

### 3. Configure Google OAuth

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Create an OAuth 2.0 Client ID
4. Add `http://localhost:5000/auth/google/callback` to Authorized Redirect URIs
5. Add your client ID and secret to `user-service/.env`

### 4. Start the Services

Start each service in a separate terminal:

```bash
# Terminal 1: User Service
cd user-service
source ../venv/bin/activate
python app.py

# Terminal 2: Room Service
cd room-service
source ../venv/bin/activate
python app.py

# Terminal 3: Reservation Service
cd reservation-service
source ../venv/bin/activate
python app.py
```

## API Documentation

### User Service (Port 5000)

#### Authentication
- `GET /auth/google/login` - Initiate Google OAuth login
- `GET /auth/google/callback` - OAuth callback endpoint

#### User Management
- `GET /users/profile` - Get current user profile
- `PUT /users/profile` - Update user profile

#### Admin User Management
- `GET /admin/users` - List all users (admin only)
- `PUT /admin/users/{id}` - Update user details (admin only)
- `DELETE /admin/users/{id}` - Delete a user (admin only)

### Room Service (Port 5001)

#### Room Management
- `GET /rooms` - List all rooms
- `GET /rooms/{id}` - Get room details
- `POST /rooms` - Create a new room (admin only)
- `PUT /rooms/{id}` - Update room details (admin only)
- `DELETE /rooms/{id}` - Delete a room (admin only)

### Reservation Service (Port 5002)

#### Reservation Management
- `GET /reservations` - List all user reservations
- `GET /reservations/{id}` - Get reservation details
- `POST /reservations` - Create a new reservation
- `PUT /reservations/{id}` - Update a reservation
- `DELETE /reservations/{id}` - Cancel a reservation

#### Availability
- `GET /availability` - Check room availability
  - Query parameters: `room_id`, `date`


## License

[MIT License](LICENSE)
```
