# Database Schema for Minyan-Pays

This document outlines the complete PostgreSQL schema design for managing users, attendance, payments, and funds within the Minyan-Pays application.

## Users Table
This table contains all the user information.

| Column Name      | Data Type   | Constraints          | Description                      |
|------------------|-------------|----------------------|----------------------------------|
| id               | SERIAL      | PRIMARY KEY          | Unique identifier for each user.
| username         | VARCHAR(50) | UNIQUE, NOT NULL     | The user's chosen username.
| password_hash    | TEXT        | NOT NULL             | Hashed password for security.   |
| email            | VARCHAR(100)| UNIQUE, NOT NULL     | The user's email address.       |
| created_at       | TIMESTAMP   | DEFAULT NOW()        | Timestamp of user creation.     |
| updated_at       | TIMESTAMP   | DEFAULT NOW()        | Timestamp of last update.       |

## Attendance Table
This table tracks user attendance to events.

| Column Name      | Data Type   | Constraints          | Description                      |
|------------------|-------------|----------------------|----------------------------------|
| id               | SERIAL      | PRIMARY KEY          | Unique identifier for each entry.
| user_id          | INTEGER     | REFERENCES users(id)  | The user who attended the event.
| event_date       | DATE        | NOT NULL             | The date of the event attended.
| created_at       | TIMESTAMP   | DEFAULT NOW()        | Timestamp of when the attendance was recorded.

## Payments Table
This table manages payments made by users.

| Column Name      | Data Type   | Constraints          | Description                      |
|------------------|-------------|----------------------|----------------------------------|
| id               | SERIAL      | PRIMARY KEY          | Unique identifier for each payment.
| user_id          | INTEGER     | REFERENCES users(id)  | The user who made the payment.
| amount           | NUMERIC(10, 2)| NOT NULL            | The amount of the payment.
| payment_date      | TIMESTAMP   | DEFAULT NOW()        | The timestamp of when the payment was made.
| payment_method   | VARCHAR(50) | NOT NULL             | The method used for payment (e.g., credit card, PayPal).

## Funds Management Table
This table handles the funds for the application.

| Column Name      | Data Type   | Constraints          | Description                      |
|------------------|-------------|----------------------|----------------------------------|
| id               | SERIAL      | PRIMARY KEY          | Unique identifier for each fund entry.
| user_id          | INTEGER     | REFERENCES users(id)  | The user associated with the fund.
| balance          | NUMERIC(10, 2)| NOT NULL            | Current balance of the user.
| updated_at       | TIMESTAMP   | DEFAULT NOW()        | Timestamp of the last update to the balance.

## Relationships
- Each user can have multiple attendance records.
- Each user can have multiple payments recorded.
- Each user can have a separate fund management entry, reflecting their balance.

## Conclusion
This schema is essential for understanding how data is organized and accessed within the Minyan-Pays application, facilitating efficient data management and retrieval based on user interactions with the system.