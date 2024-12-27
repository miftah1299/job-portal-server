# Job Portal Server

This is the backend server for the Job Portal application. It is built using Node.js, Express, and MongoDB.

## Prerequisites

-   Node.js
-   MongoDB

## Installation

1. Clone the repository:

    ```sh
    git clone https://github.com/your-username/job-portal-server.git
    cd job-portal-server
    ```

2. Install the dependencies:

    ```sh
    npm install
    ```

3. Create a `.env` file in the root directory and add your MongoDB credentials and JWT secret key:
    ```env
    DB_USER=your_db_user
    DB_PASS=your_db_password
    JWT_SECRET_KEY=your_jwt_secret_key
    PORT=5000
    ```

## Running the Server

Start the server:

```sh
npm start
```
