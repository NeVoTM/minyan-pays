# TESTING_SETUP.md

## PostgreSQL Setup Instructions

1. **Install PostgreSQL**: 
   - For Ubuntu: 
     ```bash
     sudo apt update
     sudo apt install postgresql postgresql-contrib
     ```  
   - For macOS: 
     ```bash
     brew install postgresql
     ```

2. **Initialize the Database**:  
   - Start the PostgreSQL service:  
     ```bash
     sudo service postgresql start
     ```  
   - Log into the PostgreSQL shell:  
     ```bash
     sudo -u postgres psql
     ```
   - Create a new database:  
     ```sql
     CREATE DATABASE minyan_pays;
     ```  
   - Create a new user and set a password:  
     ```sql
     CREATE USER minyan_user WITH PASSWORD 'your_password';
     ```  
   - Grant privileges to the user:  
     ```sql
     GRANT ALL PRIVILEGES ON DATABASE minyan_pays TO minyan_user;
     ```  
   - Exit the PostgreSQL shell:  
     ```sql
     \q
     ```

## Environment Configuration (.env Setup for Local Testing)

1. **Create the .env File**:  
   - Navigate to the root directory of the project and create a file named `.env`:  
     ```bash
     touch .env
     ```

2. **Edit the .env File**:  
   - Add the following configuration:  
     ```plaintext
     DATABASE_URL=postgres://minyan_user:your_password@localhost/minyan_pays
     SECRET_KEY=your_secret_key
     DEBUG=True
     ```

## Step-by-Step Testing Instructions
   
### Admin Login and Dashboard
1. Open your web browser and go to the login page: `http://localhost:3000/admin`
2. Enter your admin credentials (username: `admin`, password: `admin_password`).
3. Verify successful login by checking for admin dashboard elements.

### Member Punch-in/Login
1. Open the punch-in page: `http://localhost:3000/punch-in`
2. Enter a member ID and click `Punch In`.
3. Confirm that the attendance record has been created in the database.

### Treasury Management
1. Access the treasury management section: `http://localhost:3000/treasury`
2. Verify that you can view the current treasury balance.
3. Attempt to add a new treasury entry using the provided form.

### Creating New Members
1. Navigate to the members section: `http://localhost:3000/members`
2. Fill out the form to create a new member with necessary details.
3. Submit the form and check if the new member appears in the member list.

### Attendance Confirmation/Rejection
1. Go to the attendance section: `http://localhost:3000/attendance`
2. Locate a recent attendance record and select it.
3. Attempt to confirm or reject the attendance.

## CURL Commands for API Testing

- **Get All Members**:
  ```bash
  curl -X GET http://localhost:3000/api/members
  ```
- **Create a New Member**:
  ```bash
  curl -X POST http://localhost:3000/api/members -d '{"name":"John Doe", "email":"john@example.com"}' -H 'Content-Type: application/json'
  ```
- **Punch In**:
  ```bash
  curl -X POST http://localhost:3000/api/punch-in -d '{"memberId":1}' -H 'Content-Type: application/json'
  ```

## Troubleshooting Section

- **Issue**: PostgreSQL connection error.
  - **Solution**: Ensure the PostgreSQL service is running and the credentials in the .env file are correct.

- **Issue**: Application fails to start.
  - **Solution**: Check for syntax errors in your configuration files or code.

## Running Both Backend and Frontend

1. **Start the Backend**:
   - Navigate to the backend directory and run:  
     ```bash
     npm run start
     ```

2. **Start the Frontend**:
   - Navigate to the frontend directory and run:  
     ```bash
     npm start
     ```

3. Ensure both servers are running and accessible at their respective ports (default: 3000 for frontend, 5000 for backend).
