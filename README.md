# EventFlow

**EventFlow** is a full-stack event booking and ticketing platform built to explore the backend problems behind real-time seat reservation systems: concurrent seat selection, booking consistency, payment verification, authentication, and event-driven post-booking processing.

The project uses **Spring Boot + PostgreSQL** for the core application, **Redis** for temporary seat locks and refresh-token state, **Apache Kafka** for booking-confirmed events, and a **React + TypeScript** frontend.

## Tech Stack

### Backend
- Java 17
- Spring Boot 3
- Spring Security
- Spring Data JPA / Hibernate
- PostgreSQL
- Redis
- Apache Kafka
- Flyway
- Maven

### Frontend
- React 18
- TypeScript
- Vite
- TanStack Query
- Zustand
- React Hook Form + Zod
- Tailwind CSS

### Infrastructure
- Docker / Docker Compose
- Nginx
- Swagger / OpenAPI

## Core Features

- JWT-based authentication with access and refresh tokens
- Role-based authorization for customers, organizers, venue managers, and admins
- Event creation and management
- Venue and seat-map management
- Interactive seat selection
- Temporary seat reservation with Redis TTL-based locks
- Booking creation, confirmation, cancellation, and expiry handling
- Razorpay payment-signature verification during booking confirmation
- Ticket-record generation after successful bookings
- Ticket lookup and verification
- Kafka-based `booking.confirmed` producer-consumer flow
- Scheduled cleanup of expired pending bookings
- Database schema versioning with Flyway

## Booking Flow

```text
User selects seats
        |
        v
Redis seat locks (TTL)
        |
        v
Pending booking created
        |
        v
Payment completed
        |
        v
Payment signature verified
        |
        v
SERIALIZABLE booking transaction
+ pessimistic seat row locking
        |
        v
Booking confirmed / seats marked booked
        |
        v
Kafka: booking.confirmed
        |
        v
Ticket records generated
```

## Preventing Double Booking

A major focus of EventFlow is handling concurrent attempts to reserve the same seat.

### 1. Temporary Redis lock

When a user selects a seat, the backend uses Redis `setIfAbsent` with a TTL. Only one user can obtain the lock for a particular event-seat key at a time.

Locks are ownership-aware: release and extension operations use Redis-side scripts so one user cannot accidentally release another user's lock.

### 2. Database-level consistency on confirmation

The final booking-confirmation method runs with **SERIALIZABLE transaction isolation**. Event-seat rows are additionally fetched with **pessimistic write locks** before being marked as booked.

This creates two layers of protection:
- Redis handles the short-lived reservation experience.
- PostgreSQL protects the final persisted booking state.

### 3. Expired booking cleanup

Pending bookings store an expiry time. A scheduled job finds expired bookings, marks them expired, and releases their associated seat locks.

## Event-Driven Processing with Kafka

After a booking is successfully confirmed, EventFlow publishes a `booking.confirmed` event using `KafkaTemplate`.

A Kafka consumer listens for that event and triggers:
- ticket-record generation for the booked seats
- the booking-confirmation notification hook

This separates post-booking work from the booking-confirmation request path.

> The current ticket implementation creates unique ticket codes and persists ticket records. QR/PDF URLs are represented in the data model, but real QR/PDF generation and S3 upload are not implemented yet.

## Authentication and Security

The backend uses Spring Security with JWT authentication.

- Passwords are encoded before persistence.
- Access and refresh tokens are generated separately.
- Refresh-token state is stored in Redis for validation and revocation.
- Protected endpoints are authorized by user role.
- Payment confirmation verifies the Razorpay HMAC-SHA256 signature before a booking is finalized.

## Project Structure

```text
eventflow/
├── backend/
│   ├── src/main/java/com/eventflow/
│   │   ├── common/
│   │   ├── config/
│   │   ├── modules/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── booking/
│   │   │   ├── event/
│   │   │   ├── notification/
│   │   │   ├── payment/
│   │   │   ├── ticket/
│   │   │   ├── user/
│   │   │   └── venue/
│   │   └── security/
│   └── src/main/resources/
│       └── db/migration/
├── frontend/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── pages/
│       ├── routes/
│       └── stores/
├── docker-compose.yml
└── README.md
```

## Run Locally

### Prerequisites

- Docker Desktop / Docker Compose

### Start the complete stack

```bash
git clone https://github.com/Yash5885/EventFlow.git
cd EventFlow
docker compose up --build
```

### Services

| Service | URL / Port |
|---|---|
| Frontend | `http://localhost:3000` |
| Backend API | `http://localhost:8080` |
| Swagger UI | `http://localhost:8080/swagger-ui.html` |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |
| Kafka | `localhost:9092` |

The Docker Compose configuration contains development-only credentials. Do not reuse those values in production.

## Run Without Docker

Start PostgreSQL, Redis, and Kafka locally, then configure the backend through environment variables. A starter list is provided in `.env.example`.

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

If the Maven wrapper is not available, use your installed Maven:

```bash
mvn spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Engineering Highlights

- Redis-backed distributed seat locking with expiry
- Ownership-safe Redis lock release/extension via scripts
- SERIALIZABLE booking-confirmation transactions
- JPA pessimistic write locking for seat rows
- HMAC-SHA256 payment-signature verification
- Kafka producer-consumer integration for confirmed bookings
- Redis-backed refresh-token validation and revocation
- Multi-role API authorization with Spring Security
- Flyway-managed PostgreSQL migrations
- Dockerized local environment

## Future Improvements

- Generate actual QR images and PDF tickets
- Upload generated ticket assets to S3
- Connect the notification hook to an email provider
- Add idempotency keys for external payment callbacks
- Add integration and load tests for concurrent seat booking
- Introduce observability and metrics for booking/locking flows

## Disclaimer

EventFlow is a portfolio/learning project demonstrating full-stack and backend engineering concepts. Payment and ticket-delivery integrations should be hardened further before production use.
