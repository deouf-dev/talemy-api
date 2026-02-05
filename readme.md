# Talemy API Documentation

## Overview

Talemy API is a RESTful backend service for the Talemy platform, designed to connect students with teachers. The API enables user authentication, profile management, teacher search, and contact request handling.

**Base URL:** `http://localhost:<PORT>`  
**Version:** 1.0.0  
**Author:** deouf-dev

## Table of Contents

- [Authentication](#authentication)
- [Real-time Communication (Socket.IO)](#real-time-communication-socketio)
- [Endpoints](#endpoints)
  - [Auth](#auth-endpoints)
  - [Teachers](#teacher-endpoints)
  - [Students](#student-endpoints)
  - [Subjects](#subject-endpoints)
  - [Contact Requests](#contact-request-endpoints)
  - [Conversations](#conversation-endpoints)
  - [Lessons](#lesson-endpoints)
  - [Reviews](#review-endpoints)
  - [Availability Slots](#availability-slots-endpoints)
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

## Real-time Communication (Socket.IO)

The API provides real-time messaging capabilities using Socket.IO for instant communication between students and teachers.

### WebSocket Connection

**URL:** `ws://localhost:<PORT>` or `wss://localhost:<PORT>` (for secure connections)

### Authentication

WebSocket connections must be authenticated using a JWT token. Include the token in the connection handshake:

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: {
    token: "your_jwt_token_here",
  },
});
```

### Socket Events

#### Client → Server Events

##### Join Conversation

Join a conversation room to receive real-time messages.

**Event:** `conversation:join`

**Payload:**

```json
{
  "conversationId": 1
}
```

**Response Event:** `conversation:joined`

```json
{
  "conversationId": 1
}
```

**Error Event:** `socket:error`

```json
{
  "code": 404,
  "type": "NOT_FOUND",
  "message": "Conversation not found"
}
```

---

##### Send Message

Send a real-time message in a conversation.

**Event:** `message:send`

**Payload:**

```json
{
  "conversationId": 1,
  "content": "Hello, when can we start the lessons?"
}
```

**Response Event:** `message:sent`

```json
{
  "conversationId": 1,
  "messageId": 42
}
```

**Error Event:** `socket:error`

```json
{
  "code": 400,
  "type": "VALIDATION_ERROR",
  "message": "Message content is required"
}
```

**Validation:**

- `conversationId` is required
- `content` is required and must be a non-empty string
- `content` maximum length: 2000 characters
- User must have joined the conversation first
- Contact request must be ACCEPTED

---

#### Server → Client Events

##### New Message

Received when any participant sends a message in a conversation you've joined.

**Event:** `message:new`

**Payload:**

```json
{
  "conversationId": 1,
  "message": {
    "id": 42,
    "conversationId": 1,
    "senderUserId": 2,
    "content": "Hello, when can we start the lessons?",
    "createdAt": "2026-02-01T14:30:00.000Z"
  }
}
```

---

##### Socket Error

Received when an error occurs during socket communication.

**Event:** `socket:error`

**Payload:**

```json
{
  "code": 403,
  "type": "FORBIDDEN",
  "message": "You are not a participant of this conversation"
}
```

**Common Error Types:**

- `VALIDATION_ERROR` (400) - Invalid data provided
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `SERVER_ERROR` (500) - Internal server error

---

##### Lesson Created

Received when a new lesson is created involving the user (as teacher or student).

**Event:** `lesson:created`

**Payload:**

```json
{
  "lesson": {
    "id": 10,
    "teacherUserId": 3,
    "studentUserId": 1,
    "subjectId": 5,
    "startAt": "2026-02-15T14:00:00.000Z",
    "durationMin": 60,
    "statusForStudent": "PENDING",
    "statusForTeacher": "PENDING",
    "createdAt": "2026-02-05T10:30:00.000Z",
    "updatedAt": "2026-02-05T10:30:00.000Z",
    "teacher": {
      "id": 3,
      "name": "Jane",
      "surname": "Smith",
      "email": "jane.smith@example.com"
    },
    "student": {
      "id": 1,
      "name": "John",
      "surname": "Doe",
      "email": "john.doe@example.com"
    },
    "subject": {
      "id": 5,
      "name": "Mathematics"
    }
  }
}
```

---

##### Lesson Status Updated

Received when a lesson status is updated by either the teacher or student.

**Event:** `lesson:statusUpdated`

**Payload:**

```json
{
  "lesson": {
    "id": 10,
    "teacherUserId": 3,
    "studentUserId": 1,
    "subjectId": 5,
    "startAt": "2026-02-15T14:00:00.000Z",
    "durationMin": 60,
    "statusForStudent": "CONFIRMED",
    "statusForTeacher": "CONFIRMED",
    "createdAt": "2026-02-05T10:30:00.000Z",
    "updatedAt": "2026-02-05T11:00:00.000Z",
    "teacher": {
      "id": 3,
      "name": "Jane",
      "surname": "Smith",
      "email": "jane.smith@example.com"
    },
    "student": {
      "id": 1,
      "name": "John",
      "surname": "Doe",
      "email": "john.doe@example.com"
    },
    "subject": {
      "id": 5,
      "name": "Mathematics"
    }
  },
  "updatedBy": 1
}
```

---

##### Contact Request Created

Received when a new contact request is created involving the user (as teacher or student).

**Event:** `contactRequest:created`

**Payload:**

```json
{
  "contactRequest": {
    "id": 15,
    "studentUserId": 1,
    "teacherUserId": 3,
    "status": "PENDING",
    "message": "I would like to learn mathematics with you",
    "createdAt": "2026-02-05T09:00:00.000Z",
    "updatedAt": "2026-02-05T09:00:00.000Z",
    "student": {
      "id": 1,
      "name": "John",
      "surname": "Doe",
      "email": "john.doe@example.com"
    }
  }
}
```

---

##### Contact Request Status Updated

Received when a contact request status is updated (accepted or rejected by teacher).

**Event:** `contactRequest:statusUpdated`

**Payload:**

```json
{
  "contactRequest": {
    "id": 15,
    "studentUserId": 1,
    "teacherUserId": 3,
    "status": "ACCEPTED",
    "message": "I would like to learn mathematics with you",
    "createdAt": "2026-02-05T09:00:00.000Z",
    "updatedAt": "2026-02-05T09:30:00.000Z",
    "student": {
      "id": 1,
      "name": "John",
      "surname": "Doe",
      "email": "john.doe@example.com"
    }
  },
  "conversation": {
    "id": 8,
    "studentUserId": 1,
    "teacherUserId": 3,
    "requestId": 15,
    "createdAt": "2026-02-05T09:30:00.000Z",
    "updatedAt": "2026-02-05T09:30:00.000Z"
  }
}
```

**Note:** The `conversation` field is only present when the status is `ACCEPTED`.

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
  "hourlyRate": 40.0
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
    "hourlyRate": 40.0
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
  "city": "Lyon"
}
```

**Response:** `200 OK`

```json
{
  "profile": {
    "id": 1,
    "userId": 1,
    "city": "Lyon"
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

## Conversation Endpoints

### Get My Conversations

Retrieves all conversations for the authenticated user.

**Endpoint:** `GET /conversations`

**Authentication:** Required

**Query Parameters:**

- `limit` (optional): Maximum number of conversations to return (default: 50)
- `offset` (optional): Number of conversations to skip (default: 0)

**Example:** `GET /conversations?limit=20&offset=0`

**Response:** `200 OK`

```json
{
  "conversations": [
    {
      "id": 1,
      "partner": {
        "id": 2,
        "name": "Jane",
        "surname": "Smith",
        "email": "jane.smith@example.com"
      },
      "lastMessage": {
        "id": 42,
        "senderUserId": 2,
        "content": "Hello, when can we start?",
        "createdAt": "2026-02-01T14:30:00.000Z"
      },
      "contactRequest": {
        "id": 5,
        "status": "ACCEPTED",
        "message": "Hi, I'm interested in mathematics lessons."
      },
      "createdAt": "2026-01-31T10:00:00.000Z",
      "updatedAt": "2026-02-01T14:30:00.000Z"
    }
  ]
}
```

**Notes:**

- Conversations are ordered by most recent activity (`updatedAt` DESC)
- The `partner` field represents the other user in the conversation (teacher for students, student for teachers)
- Only conversations with ACCEPTED contact requests are accessible

---

### Get Conversation Messages

Retrieves messages from a specific conversation with pagination.

**Endpoint:** `GET /conversations/:conversationId/messages`

**Authentication:** Required

**Parameters:**

- `conversationId` (path): The ID of the conversation

**Query Parameters:**

- `page` (optional): Page number (default: 1, min: 1, max: 10,000)
- `pageSize` (optional): Number of messages per page (default: 20, min: 1, max: 50)

**Example:** `GET /conversations/1/messages?page=1&pageSize=20`

**Response:** `200 OK`

```json
{
  "messages": [
    {
      "id": 42,
      "conversationId": 1,
      "senderUserId": 2,
      "content": "Hello, when can we start the lessons?",
      "createdAt": "2026-02-01T14:30:00.000Z"
    },
    {
      "id": 41,
      "conversationId": 1,
      "senderUserId": 1,
      "content": "Hi! I'm available this week.",
      "createdAt": "2026-02-01T14:25:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 42
}
```

**Notes:**

- Messages are ordered by most recent first (`createdAt` DESC)
- Only participants of the conversation can access messages
- Contact request must be ACCEPTED

---

### Send Message (HTTP)

Sends a message in a conversation via HTTP endpoint. For real-time messaging, use Socket.IO instead.

**Endpoint:** `POST /conversations/:conversationId/messages`

**Authentication:** Required

**Parameters:**

- `conversationId` (path): The ID of the conversation

**Request Body:**

```json
{
  "content": "Hello, when can we start the lessons?"
}
```

**Response:** `201 Created`

```json
{
  "id": 42,
  "conversationId": 1,
  "senderUserId": 1,
  "content": "Hello, when can we start the lessons?",
  "createdAt": "2026-02-01T14:30:00.000Z"
}
```

**Validation:**

- `content` is required and must be a non-empty string
- `content` maximum length: 2000 characters
- User must be a participant of the conversation
- Contact request must be ACCEPTED

**Notes:**

- This endpoint is useful for sending messages without establishing a WebSocket connection
- For real-time bidirectional communication, use the Socket.IO `message:send` event

---

## Lesson Endpoints

### Create a Lesson

**Endpoint:** `POST /lessons`

**Authentication:** Required

**Request Body:**

```json
{
  "teacherUserId": 2,
  "studentUserId": 1,
  "subjectId": 3,
  "startAt": "2026-02-15T14:00:00.000Z",
  "durationMin": 60
}
```

**Response:** `201 Created`

```json
{
  "lesson": {
    "id": 1,
    "teacherUserId": 2,
    "studentUserId": 1,
    "subjectId": 3,
    "startAt": "2026-02-15T14:00:00.000Z",
    "durationMin": 60,
    "statusForTeacher": "PENDING",
    "statusForStudent": "PENDING",
    "createdAt": "2026-02-02T10:00:00.000Z",
    "updatedAt": "2026-02-02T10:00:00.000Z"
  }
}
```

**Validation:**

- All fields are required
- `teacherUserId` and `studentUserId` must be different
- `durationMin` must be a positive integer
- `startAt` must be in the future
- Teacher must have role TEACHER

---

### Get My Lessons

**Endpoint:** `GET /lessons/me`

**Authentication:** Required

**Query Parameters:**

- `status` (optional): Filter by status (PENDING, CONFIRMED, CANCELLED)
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20, max: 50)

**Response:** `200 OK`

```json
{
  "items": [
    {
      "id": 1,
      "teacherUserId": 2,
      "studentUserId": 1,
      "subjectId": 3,
      "startAt": "2026-02-15T14:00:00.000Z",
      "durationMin": 60,
      "status": "CONFIRMED",
      "teacher": {
        "id": 2,
        "name": "John",
        "surname": "Doe",
        "email": "john@example.com"
      },
      "student": {
        "id": 1,
        "name": "Jane",
        "surname": "Smith",
        "email": "jane@example.com"
      },
      "subject": {
        "id": 3,
        "name": "Mathematics"
      }
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

---

### Get Upcoming Lessons

**Endpoint:** `GET /lessons/upcoming`

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "lessons": [
    {
      "id": 1,
      "teacherUserId": 2,
      "studentUserId": 1,
      "subjectId": 3,
      "startAt": "2026-02-15T14:00:00.000Z",
      "durationMin": 60,
      "statusForTeacher": "CONFIRMED",
      "statusForStudent": "CONFIRMED",
      "teacher": {
        "id": 2,
        "name": "John",
        "surname": "Doe",
        "email": "john@example.com"
      },
      "student": {
        "id": 1,
        "name": "Jane",
        "surname": "Smith",
        "email": "jane@example.com"
      },
      "subject": {
        "id": 3,
        "name": "Mathematics"
      }
    }
  ]
}
```

**Notes:**

- Returns up to 10 upcoming lessons (PENDING or CONFIRMED status)
- Sorted by start date (ascending)

---

### Get Lesson by ID

**Endpoint:** `GET /lessons/:lessonId`

**Authentication:** Required

**Parameters:**

- `lessonId` (path): The ID of the lesson

**Response:** `200 OK`

```json
{
  "lesson": {
    "id": 1,
    "teacherUserId": 2,
    "studentUserId": 1,
    "subjectId": 3,
    "startAt": "2026-02-15T14:00:00.000Z",
    "durationMin": 60,
    "statusForTeacher": "CONFIRMED",
    "statusForStudent": "PENDING",
    "teacher": {
      "id": 2,
      "name": "John",
      "surname": "Doe",
      "email": "john@example.com"
    },
    "student": {
      "id": 1,
      "name": "Jane",
      "surname": "Smith",
      "email": "jane@example.com"
    },
    "subject": {
      "id": 3,
      "name": "Mathematics"
    }
  }
}
```

**Authorization:**

- Only the teacher or student involved in the lesson can access it

---

### Update Lesson Status

**Endpoint:** `PATCH /lessons/:lessonId/status`

**Authentication:** Required

**Parameters:**

- `lessonId` (path): The ID of the lesson

**Request Body:**

```json
{
  "status": "CONFIRMED"
}
```

**Response:** `200 OK`

```json
{
  "lesson": {
    "id": 1,
    "status": "CONFIRMED",
    ...
  }
}
```

**Validation:**

- `status` must be one of: PENDING, CONFIRMED, CANCELLED
- Only the teacher or student involved can update the status

---

### Delete a Lesson

**Endpoint:** `DELETE /lessons/:lessonId`

**Authentication:** Required

**Parameters:**

- `lessonId` (path): The ID of the lesson

**Response:** `204 No Content`

**Authorization:**

- Only the teacher or student involved in the lesson can delete it

---

## Review Endpoints

### Create a Review

**Endpoint:** `POST /reviews`

**Authentication:** Required (STUDENT role only)

**Request Body:**

```json
{
  "teacherUserId": 2,
  "rating": 5,
  "comment": "Excellent teacher! Very patient and knowledgeable."
}
```

**Response:** `201 Created`

```json
{
  "review": {
    "id": 1,
    "teacherUserId": 2,
    "studentUserId": 1,
    "rating": 5,
    "comment": "Excellent teacher! Very patient and knowledgeable.",
    "createdAt": "2026-02-02T10:00:00.000Z"
  }
}
```

**Validation:**

- `teacherUserId` and `rating` are required
- `rating` must be an integer between 1 and 5
- `comment` maximum length: 1000 characters
- Cannot review the same teacher twice
- Teacher profile rating average is automatically updated

---

### Get My Reviews (Student)

**Endpoint:** `GET /reviews/me`

**Authentication:** Required (STUDENT role only)

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20, max: 50)

**Response:** `200 OK`

```json
{
  "items": [
    {
      "id": 1,
      "teacherUserId": 2,
      "studentUserId": 1,
      "rating": 5,
      "comment": "Excellent teacher!",
      "createdAt": "2026-02-02T10:00:00.000Z",
      "teacher": {
        "id": 2,
        "name": "John",
        "surname": "Doe"
      }
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

---

### Get Teacher Reviews

**Endpoint:** `GET /reviews/teacher/:teacherUserId`

**Authentication:** Not required

**Parameters:**

- `teacherUserId` (path): The ID of the teacher

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20, max: 50)

**Response:** `200 OK`

```json
{
  "items": [
    {
      "id": 1,
      "teacherUserId": 2,
      "studentUserId": 1,
      "rating": 5,
      "comment": "Excellent teacher!",
      "createdAt": "2026-02-02T10:00:00.000Z",
      "student": {
        "id": 1,
        "name": "Jane",
        "surname": "Smith"
      }
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

**Notes:**

- Also accessible via `/teachers/:userId/reviews`

---

### Get Review by ID

**Endpoint:** `GET /reviews/:reviewId`

**Authentication:** Required

**Parameters:**

- `reviewId` (path): The ID of the review

**Response:** `200 OK`

```json
{
  "review": {
    "id": 1,
    "teacherUserId": 2,
    "studentUserId": 1,
    "rating": 5,
    "comment": "Excellent teacher!",
    "createdAt": "2026-02-02T10:00:00.000Z",
    "teacher": {
      "id": 2,
      "name": "John",
      "surname": "Doe"
    },
    "student": {
      "id": 1,
      "name": "Jane",
      "surname": "Smith"
    }
  }
}
```

---

### Update a Review

**Endpoint:** `PATCH /reviews/:reviewId`

**Authentication:** Required (STUDENT role only)

**Parameters:**

- `reviewId` (path): The ID of the review

**Request Body:**

```json
{
  "rating": 4,
  "comment": "Updated review comment"
}
```

**Response:** `200 OK`

```json
{
  "review": {
    "id": 1,
    "rating": 4,
    "comment": "Updated review comment",
    ...
  }
}
```

**Validation:**

- At least one field must be provided
- Only the student who created the review can update it
- Teacher rating average is automatically recalculated

---

### Delete a Review

**Endpoint:** `DELETE /reviews/:reviewId`

**Authentication:** Required (STUDENT role only)

**Parameters:**

- `reviewId` (path): The ID of the review

**Response:** `204 No Content`

**Authorization:**

- Only the student who created the review can delete it
- Teacher rating average is automatically recalculated

---

## Availability Slots Endpoints

### Create an Availability Slot

**Endpoint:** `POST /availability`

**Authentication:** Required (TEACHER role only)

**Request Body:**

```json
{
  "dayOfWeek": 1,
  "startAt": "2026-02-03T09:00:00.000Z",
  "endAt": "2026-02-03T12:00:00.000Z"
}
```

**Response:** `201 Created`

```json
{
  "slot": {
    "id": 1,
    "teacherUserId": 2,
    "dayOfWeek": 1,
    "startAt": "2026-02-03T09:00:00.000Z",
    "endAt": "2026-02-03T12:00:00.000Z",
    "createdAt": "2026-02-02T10:00:00.000Z",
    "updatedAt": "2026-02-02T10:00:00.000Z"
  }
}
```

**Validation:**

- All fields are required
- `dayOfWeek` must be an integer between 0 (Sunday) and 6 (Saturday)
- `startAt` must be before `endAt`
- Slot cannot overlap with existing availability slots

---

### Get My Availability Slots

**Endpoint:** `GET /availability/me`

**Authentication:** Required (TEACHER role only)

**Response:** `200 OK`

```json
{
  "slots": [
    {
      "id": 1,
      "teacherUserId": 2,
      "dayOfWeek": 1,
      "startAt": "2026-02-03T09:00:00.000Z",
      "endAt": "2026-02-03T12:00:00.000Z",
      "createdAt": "2026-02-02T10:00:00.000Z",
      "updatedAt": "2026-02-02T10:00:00.000Z"
    }
  ]
}
```

---

### Get Teacher Availability

**Endpoint:** `GET /availability/teacher/:teacherUserId`

**Authentication:** Not required

**Parameters:**

- `teacherUserId` (path): The ID of the teacher

**Query Parameters:**

- `dayOfWeek` (optional): Filter by day of week (0-6)

**Response:** `200 OK`

```json
{
  "slots": [
    {
      "id": 1,
      "teacherUserId": 2,
      "dayOfWeek": 1,
      "startAt": "2026-02-03T09:00:00.000Z",
      "endAt": "2026-02-03T12:00:00.000Z",
      "createdAt": "2026-02-02T10:00:00.000Z",
      "updatedAt": "2026-02-02T10:00:00.000Z"
    }
  ]
}
```

**Notes:**

- Also accessible via `/teachers/:userId/availability`

---

### Get Availability Slot by ID

**Endpoint:** `GET /availability/:slotId`

**Authentication:** Required (TEACHER role only)

**Parameters:**

- `slotId` (path): The ID of the availability slot

**Response:** `200 OK`

```json
{
  "slot": {
    "id": 1,
    "teacherUserId": 2,
    "dayOfWeek": 1,
    "startAt": "2026-02-03T09:00:00.000Z",
    "endAt": "2026-02-03T12:00:00.000Z",
    "createdAt": "2026-02-02T10:00:00.000Z",
    "updatedAt": "2026-02-02T10:00:00.000Z"
  }
}
```

**Authorization:**

- Only the teacher who created the slot can access it

---

### Update an Availability Slot

**Endpoint:** `PATCH /availability/:slotId`

**Authentication:** Required (TEACHER role only)

**Parameters:**

- `slotId` (path): The ID of the availability slot

**Request Body:**

```json
{
  "dayOfWeek": 2,
  "startAt": "2026-02-04T10:00:00.000Z",
  "endAt": "2026-02-04T13:00:00.000Z"
}
```

**Response:** `200 OK`

```json
{
  "slot": {
    "id": 1,
    "teacherUserId": 2,
    "dayOfWeek": 2,
    "startAt": "2026-02-04T10:00:00.000Z",
    "endAt": "2026-02-04T13:00:00.000Z",
    "createdAt": "2026-02-02T10:00:00.000Z",
    "updatedAt": "2026-02-02T15:30:00.000Z"
  }
}
```

**Validation:**

- At least one field must be provided
- Only the teacher who created the slot can update it
- Updated slot cannot overlap with other existing slots

---

### Delete an Availability Slot

**Endpoint:** `DELETE /availability/:slotId`

**Authentication:** Required (TEACHER role only)

**Parameters:**

- `slotId` (path): The ID of the availability slot

**Response:** `204 No Content`

**Authorization:**

- Only the teacher who created the slot can delete it

---

### Delete All Availability Slots

**Endpoint:** `DELETE /availability`

**Authentication:** Required (TEACHER role only)

**Response:** `200 OK`

```json
{
  "deletedCount": 5
}
```

**Notes:**

- Deletes all availability slots for the authenticated teacher

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
  ratingAvg: Decimal;
  reviewsCount: number;
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
  track: string;
  level: "MIDDLE_SCHOOL" | "HIGH_SCHOOL" | "UNIVERSITY" | "OTHER";
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

### Conversation

```typescript
{
  id: number;
  studentUserId: number;
  teacherUserId: number;
  requestId: number;
  createdAt: Date;
  updatedAt: Date;
  student?: User;
  teacher?: User;
  contactRequest?: ContactRequest;
}
```

**Notes:**

- A conversation is automatically created when a contact request is ACCEPTED
- Each conversation is linked to a unique contact request via `requestId`
- Only participants (student and teacher) can access the conversation

### Lesson

```typescript
{
  id: number,;
  subjectId: number;
  teacherUserId: number;
  studentUserId: number;
  startAt: Date;
  durationMin: number;
  statusForTeacher: "PENDING" | "CONFIRMED" | "CANCELLED";
  statausForStudent: "PENDING" | "CONFIRMED" | "CANCELLED";
  student?: User;
  teacher?: User;
}
```

### Message

```typescript
{
  id: number;
  conversationId: number;
  senderUserId: number;
  content: string;
  createdAt: Date;
  conversation?: Conversation;
  sender?: User;
}
```

**Notes:**

- Messages belong to a conversation
- `senderUserId` indicates who sent the message (either student or teacher)
- Maximum content length: 2000 characters

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
- `409 Conflict` - Resource conflict (e.g., inactive conversation)
- `500 Internal Server Error` - Server error

### Common Error Codes

- `VALIDATION_ERROR` - Invalid input data
- `AUTHENTICATION_ERROR` - Invalid credentials
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `DUPLICATE_EMAIL` - Email already exists
- `CONFLICT` - Conversation is not active or contact request not accepted
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
- **Socket.IO** - Real-time bidirectional communication
- **Sequelize** - ORM for MySQL
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **MySQL** - Database

---

## Support

For issues or questions, please contact the development team or open an issue in the repository.

---

**Last Updated:** February 1, 2026
