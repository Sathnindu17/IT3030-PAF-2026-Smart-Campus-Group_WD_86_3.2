# Smart Campus Operations Hub

A full-stack university campus management system built with **Spring Boot + MongoDB** (backend) and **React + Vite** (frontend).

## 🏫 Features

### Core Modules
1. **Authentication** — Manual registration (with role selection) and Google Sign-In
2. **Facilities & Assets** — CRUD for lecture halls, labs, meeting rooms, equipment
3. **Booking Management** — Request, approve/reject, cancel bookings with conflict prevention
4. **Maintenance Tickets** — Incident reporting with image attachments, technician assignment, comments
5. **Notifications** — In-app notifications for booking and ticket actions

### Roles
| Role | Capabilities |
|------|-------------|
| **USER** | Browse resources, create bookings, create tickets, comment, receive notifications |
| **ADMIN** | Manage resources, approve/reject bookings, assign technicians, manage all tickets |
| **TECHNICIAN** | View assigned tickets, update status, add resolution notes |

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 21, Spring Boot 3.2, Spring Security, Spring Data MongoDB |
| Frontend | React 18, React Router 6, Axios, Vite |
| Database | MongoDB (Atlas or local) |
| Auth | JWT + BCrypt + Google OAuth2 |

## 📁 Project Structure

```
project/
├── backend/                           # Spring Boot
│   └── src/main/java/com/smartcampus/
│       ├── config/                    # Security, CORS, Web config
│       ├── security/                  # JWT util & filter
│       ├── common/                    # Exception handler, ApiResponse
│       └── modules/
│           ├── auth/                  # Login, Register, Google OAuth
│           ├── users/                 # User model & repository
│           ├── resources/             # Facilities CRUD
│           ├── bookings/              # Booking workflow
│           ├── tickets/               # Incident ticketing
│           ├── comments/              # Ticket comments
│           ├── notifications/         # Notifications
│           └── upload/                # File upload handler
└── frontend/                          # React + Vite
    └── src/
        ├── api/                       # Axios config & API methods
        ├── context/                   # AuthContext
        ├── components/                # NotificationBell, etc.
        ├── layouts/                   # AppLayout with sidebar
        ├── pages/                     # All pages by feature
        └── routes/                    # ProtectedRoute
```

## 🚀 Setup Instructions

### Prerequisites
- Java 21+
- Node.js 18+
- MongoDB (Atlas cloud or local)
- Maven

### 1. Configure Environment Variables

Create a `.env` file or set these environment variables:

```bash
# Required
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/smartcampus

# Required - use a long random string for production
JWT_SECRET=your-jwt-secret-key-at-least-32-characters-long

# Optional - for Google Sign-In
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 2. Run the Backend

```bash
cd backend

# Set environment variables first, then:
mvn spring-boot:run
```

The backend starts at `http://localhost:8080`

### 3. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at `http://localhost:5173`

### 4. Test the App

1. Open `http://localhost:5173` in your browser
2. Click **Get Started** to register
3. Choose a role (USER, ADMIN, or TECHNICIAN)
4. Start using the system!

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/google` | Google sign-in |
| GET | `/api/auth/me` | Get current user |

### Resources
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/resources` | All | List/filter resources |
| GET | `/api/resources/:id` | All | Get resource by ID |
| POST | `/api/resources` | Admin | Create resource |
| PUT | `/api/resources/:id` | Admin | Update resource |
| DELETE | `/api/resources/:id` | Admin | Delete resource |

### Bookings
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/bookings` | All | Create booking request |
| GET | `/api/bookings/my` | All | Get my bookings |
| GET | `/api/bookings/admin/all` | Admin | Get all bookings |
| PATCH | `/api/bookings/:id/approve` | Admin | Approve booking |
| PATCH | `/api/bookings/:id/reject` | Admin | Reject booking |
| PATCH | `/api/bookings/:id/cancel` | All | Cancel own booking |

### Tickets
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/tickets` | All | Create ticket |
| GET | `/api/tickets/:id` | All | Get ticket details |
| GET | `/api/tickets/my` | All | Get my tickets |
| GET | `/api/tickets/admin/all` | Admin | Get all tickets |
| GET | `/api/tickets/assigned` | Tech/Admin | Get assigned tickets |
| PATCH | `/api/tickets/:id/assign` | Admin | Assign technician |
| PATCH | `/api/tickets/:id/status` | Tech/Admin | Update status |
| PATCH | `/api/tickets/:id/resolve` | Tech/Admin | Add resolution notes |

### Comments
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/comments` | All | Add comment |
| GET | `/api/comments/ticket/:id` | All | Get comments for ticket |
| PUT | `/api/comments/:id` | Owner | Edit own comment |
| DELETE | `/api/comments/:id` | Owner | Delete own comment |

### Notifications
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/notifications` | All | Get my notifications |
| GET | `/api/notifications/unread-count` | All | Get unread count |
| PATCH | `/api/notifications/:id/read` | All | Mark as read |
| PATCH | `/api/notifications/read-all` | All | Mark all as read |

### File Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload images (max 3, 5MB each) |

## 👥 Team Work Allocation

| Member | Module | Key Files |
|--------|--------|-----------|
| Member 1 | Auth + Security | `auth/`, `security/`, `config/`, Login/Register pages |
| Member 2 | Resources + Bookings | `resources/`, `bookings/`, Resource & Booking pages |
| Member 3 | Tickets + Comments | `tickets/`, `comments/`, `upload/`, Ticket pages |
| Member 4 | Notifications + UI | `notifications/`, Layout, Dashboard, Styling |

## 📋 Sample Error Response

```json
{
  "success": false,
  "message": "Time slot conflicts with an existing booking",
  "data": null,
  "timestamp": "2024-03-15T10:30:00"
}
```

## 📋 Sample Validation Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "email": "Invalid email format",
    "password": "Password must be at least 6 characters"
  }
}
```
