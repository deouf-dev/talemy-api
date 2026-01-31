# Talemy API Documentation

## Overview

Talemy API is a RESTful backend service for the Talemy platform, designed to connect students with teachers. The API enables user authentication, profile management, teacher search, and contact request handling.

**Base URL:** `http://localhost:<PORT>`  
**Version:** 1.0.0  
**Author:** deouf-dev

## Table of Contents

- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Auth](#auth-endpoints)
  - [Teachers](#teacher-endpoints)
  - [Students](#student-endpoints)
  - [Subjects](#subject-endpoints)
  - [Contact Requests](#contact-request-endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)

---

## Authentication

The API uses JWT (JSON Web Token) for authentication. After successful login or registration, clients receive a token that must be included in subsequent requests.

### Authorization Header

```
Authorization: Bearer <your_jwt_token>
```

### User Roles

- **STUDENT**: Can create profiles, search teachers, and send contact requests
- **TEACHER**: Can create profiles, manage subjects, and respond to contact requests
- **ADMIN**: Administrative privileges

---

## Endpoints

## Auth Endpoints

### Register User

Creates a new user account and returns the user object.

**Endpoint:** `POST /auth/register`

**Request Body:**

```json
{
  "name": "John",
  "surname": "Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "role": "STUDENT"
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "name": "John",
  "surname": "Doe",
  "email": "john.doe@example.com",
  "role": "STUDENT",
  "createdAt": "2026-01-31T10:00:00.000Z",
  "updatedAt": "2026-01-31T10:00:00.000Z"
}
```

---

### Login User

Authenticates a user and returns a JWT token.

**Endpoint:** `POST /auth/login`

**Request Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John",
    "surname": "Doe",
    "email": "john.doe@example.com",
    "role": "STUDENT"
  }
}
```

---

### Get Current User

Returns the authenticated user's information.

**Endpoint:** `GET /auth/me`

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "user": {
    "id": 1,
    "name": "John",
    "surname": "Doe",
    "email": "john.doe@example.com",
    "role": "STUDENT"
  }
}
```

---

## Teacher Endpoints

### Get My Teacher Profile

Retrieves the authenticated teacher's profile.

**Endpoint:** `GET /teachers/me`

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "profile": {
    "id": 1,
    "userId": 1,
    "bio": "Experienced mathematics teacher",
    "city": "Paris",
    "hourlyRate": 35.0,
    "phone": "+33612345678",
    "user": {
      "id": 1,
      "name": "Jane",
      "surname": "Smith",
      "email": "jane.smith@example.com"
    },
    "subjects": [
      {
        "id": 1,
        "name": "Mathematics"
      }
    ]
  }
}
```

---

### Update My Teacher Profile

Updates the authenticated teacher's profile information.

**Endpoint:** `PATCH /teachers/me`

**Authentication:** Required

**Request Body:**

```json
{
  "bio": "Updated bio text",
  "city": "Lyon",
  "hourlyRate": 40.0,
  "phone": "+33698765432"
}
```

**Response:** `200 OK`

```json
{
  "profile": {
    "id": 1,
    "userId": 1,
    "bio": "Updated bio text",
    "city": "Lyon",
    "hourlyRate": 40.0,
    "phone": "+33698765432"
  }
}
```

---

### Update My Teacher Subjects

Updates the list of subjects a teacher can teach.

**Endpoint:** `PUT /teachers/me/subjects`

**Authentication:** Required (TEACHER role only)

**Request Body:**

```json
{
  "subjectIds": [1, 3, 5]
}
```

**Response:** `200 OK`

```json
{
  "profile": {
    "id": 1,
    "userId": 1,
    "bio": "Experienced mathematics teacher",
    "subjects": [
      {
        "id": 1,
        "name": "Mathematics"
      },
      {
        "id": 3,
        "name": "Physics"
      },
      {
        "id": 5,
        "name": "Chemistry"
      }
    ]
  }
}
```

---

### Get Teacher Profile

Retrieves a specific teacher's public profile.

**Endpoint:** `GET /teachers/:userId`

**Authentication:** Required

**Parameters:**

- `userId` (path): The user ID of the teacher

**Response:** `200 OK`

```json
{
  "profile": {
    "id": 2,
    "userId": 2,
    "bio": "Chemistry specialist",
    "city": "Marseille",
    "hourlyRate": 30.0,
    "user": {
      "id": 2,
      "name": "Michel",
      "surname": "Dupont",
      "email": "michel.dupont@example.com"
    },
    "subjects": [
      {
        "id": 5,
        "name": "Chemistry"
      }
    ]
  }
}
```

---

### Search Teachers

Searches for teachers based on filters with pagination.

**Endpoint:** `GET /teachers`

**Authentication:** Not required

**Query Parameters:**

- `city` (optional): Filter by city name
- `subjectId` (optional): Filter by subject ID
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Number of results per page (default: 10)

**Example:** `GET /teachers?city=Paris&subjectId=1&page=1&pageSize=10`

**Response:** `200 OK`

```json
{
  "teachers": [
    {
      "id": 1,
      "userId": 1,
      "bio": "Experienced mathematics teacher",
      "city": "Paris",
      "hourlyRate": 35.0,
      "user": {
        "name": "Jane",
        "surname": "Smith"
      },
      "subjects": [
        {
          "id": 1,
          "name": "Mathematics"
        }
      ]
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

---

## Student Endpoints

### Get My Student Profile

Retrieves the authenticated student's profile.

**Endpoint:** `GET /students/me`

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "profile": {
    "id": 1,
    "userId": 1,
    "city": "Paris",
    "phone": "+33612345678",
    "user": {
      "id": 1,
      "name": "John",
      "surname": "Doe",
      "email": "john.doe@example.com"
    }
  }
}
```

---

### Update My Student Profile

Updates the authenticated student's profile information.

**Endpoint:** `PATCH /students/me`

**Authentication:** Required

**Request Body:**

```json
{
  "city": "Lyon",
  "phone": "+33698765432"
}
```

**Response:** `200 OK`

```json
{
  "profile": {
    "id": 1,
    "userId": 1,
    "city": "Lyon",
    "phone": "+33698765432"
  }
}
```

---

### Get Student Profile

Retrieves a specific student's public profile.

**Endpoint:** `GET /students/:userId`

**Authentication:** Not required

**Parameters:**

- `userId` (path): The user ID of the student

**Response:** `200 OK`

```json
{
  "profile": {
    "id": 1,
    "userId": 1,
    "city": "Paris",
    "user": {
      "id": 1,
      "name": "John",
      "surname": "Doe",
      "email": "john.doe@example.com"
    }
  }
}
```

---

## Subject Endpoints

### Get All Subjects

Retrieves a list of all available subjects.

**Endpoint:** `GET /subjects`

**Authentication:** Not required

**Response:** `200 OK`

```json
{
  "subjects": [
    {
      "id": 1,
      "name": "Mathematics",
      "createdAt": "2026-01-30T10:00:00.000Z",
      "updatedAt": "2026-01-30T10:00:00.000Z"
    },
    {
      "id": 2,
      "name": "English",
      "createdAt": "2026-01-30T10:00:00.000Z",
      "updatedAt": "2026-01-30T10:00:00.000Z"
    }
  ]
}
```

---

## Contact Request Endpoints

### Create Contact Request

Allows a student to send a contact request to a teacher.

**Endpoint:** `POST /requests`

**Authentication:** Required (STUDENT role only)

**Request Body:**

```json
{
  "teacherUserId": 2,
  "message": "Hi, I'm interested in mathematics lessons."
}
```

**Response:** `201 Created`

```json
{
  "contactRequest": {
    "id": 1,
    "studentUserId": 1,
    "teacherUserId": 2,
    "message": "Hi, I'm interested in mathematics lessons.",
    "status": "PENDING",
    "createdAt": "2026-01-31T10:00:00.000Z",
    "updatedAt": "2026-01-31T10:00:00.000Z"
  }
}
```

---

### Get My Contact Requests

Retrieves contact requests for the authenticated user (sent requests for students, received requests for teachers).

**Endpoint:** `GET /requests/me`

**Authentication:** Required

**Query Parameters:**

- `status` (optional): Filter by status (`PENDING`, `ACCEPTED`, `REJECTED`)

**Example:** `GET /requests/me?status=PENDING`

**Response:** `200 OK`

```json
{
  "contactRequests": [
    {
      "id": 1,
      "studentUserId": 1,
      "teacherUserId": 2,
      "message": "Hi, I'm interested in mathematics lessons.",
      "status": "PENDING"
    }
  ]
}
```

---

### Update Contact Request Status

Allows a teacher to accept or reject a contact request.

**Endpoint:** `PATCH /requests/:requestId`

**Authentication:** Required (TEACHER role only)

**Parameters:**

- `requestId` (path): The ID of the contact request

**Request Body:**

```json
{
  "status": "ACCEPTED"
}
```

**Valid status values:** `PENDING`, `ACCEPTED`, `REJECTED`

**Response:** `200 OK`

```json
{
  "id": 1,
  "studentUserId": 1,
  "teacherUserId": 2,
  "message": "Hi, I'm interested in mathematics lessons.",
  "status": "ACCEPTED",
  "updatedAt": "2026-01-31T11:00:00.000Z"
}
```

---

## Data Models

### User

```typescript
{
  id: number;
  name: string;
  surname: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  createdAt: Date;
  updatedAt: Date;
}
```

### Teacher Profile

```typescript
{
  id: number;
  userId: number;
  bio: string;
  city: string;
  hourlyRate: number;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  subjects?: Subject[];
}
```

### Student Profile

```typescript
{
  id: number;
  userId: number;
  city: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}
```

### Subject

```typescript
{
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Contact Request

```typescript
{
  id: number;
  studentUserId: number;
  teacherUserId: number;
  message: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
  student?: User;
  teacher?: User;
}
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Detailed error message"
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Common Error Codes

- `VALIDATION_ERROR` - Invalid input data
- `AUTHENTICATION_ERROR` - Invalid credentials
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `DUPLICATE_EMAIL` - Email already exists
- `INTERNAL_ERROR` - Server-side error

---

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MySQL database
- npm or yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables (see `.env.example`)
4. Run database migrations:

   ```bash
   npm run sequelize db:migrate
   ```

5. Seed the database (optional):

   ```bash
   npm run sequelize db:seed:all
   ```

6. Start the server:
   ```bash
   npm run dev  # Development mode
   npm start    # Production mode
   ```

---

## Technologies Used

- **Express.js** - Web framework
- **Sequelize** - ORM for MySQL
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **MySQL** - Database

---

## Support

For issues or questions, please contact the development team or open an issue in the repository.

---

**Last Updated:** January 31, 2026
