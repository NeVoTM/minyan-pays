# API Specification

This document outlines the REST API endpoints for the Minyan Pays application, including endpoints for authentication, attendance tracking, payments, fund management, and admin functions.

## Authentication

### Register User
- **POST /api/auth/register**  
  - **Description**: Register a new user.
  - **Request Body**:  
    ```json
    {
      "username": "string",
      "password": "string",
      "email": "string"
    }
    ``` 
- **Response**:  
  - `201 Created`

### Login User
- **POST /api/auth/login**  
  - **Description**: Authenticate a user.
  - **Request Body**:  
    ```json
    {
      "username": "string",
      "password": "string"
    }
    ``` 
- **Response**:  
  - `200 OK`
  - Returns JWT token

## Attendance Tracking

### Mark Attendance
- **POST /api/attendance/mark**  
  - **Description**: Mark attendance for a user.
  - **Request Body**:  
    ```json
    {
      "userId": "string",
      "eventId": "string"
    }
    ``` 
- **Response**:  
  - `200 OK`

### Get Attendance
- **GET /api/attendance/{eventId}**  
  - **Description**: Get attendance list for an event.
- **Response**:  
  - `200 OK`
  - Returns a list of attendees.

## Payments

### Create Payment
- **POST /api/payments/create**  
  - **Description**: Create a new payment.
  - **Request Body**:  
    ```json
    {
      "amount": "number",
      "userId": "string",
      "description": "string"
    }
    ``` 
- **Response**:  
  - `201 Created`

### Get Payment History
- **GET /api/payments/history/{userId}**  
  - **Description**: Retrieve payment history for a user.
- **Response**:  
  - `200 OK`
  - Returns a list of payments.

## Fund Management

### Create Fund
- **POST /api/funds/create**  
  - **Description**: Create a new fund.
  - **Request Body**:  
    ```json
    {
      "name": "string",
      "goal": "number"
    }
    ``` 
- **Response**:  
  - `201 Created`

### Get Funds
- **GET /api/funds**  
  - **Description**: Retrieve all funds.
- **Response**:  
  - `200 OK`
  - Returns a list of funds.

## Admin Functions

### Get User List
- **GET /api/admin/users**  
  - **Description**: Retrieve a list of all users.
- **Response**:  
  - `200 OK`
  - Returns a list of users.

### Delete User
- **DELETE /api/admin/users/{userId}**  
  - **Description**: Delete a user by ID.
- **Response**:  
  - `204 No Content`  

---

This API specification provides a comprehensive overview of the available endpoints and their functionality. Please refer to each endpoint for specific request and response formats.