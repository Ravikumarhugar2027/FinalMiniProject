
# Intelligent Timetable Management System (SMVITM)

This project is a full-stack application designed to manage teacher absences at Shri Madhwa Vadiraja Institute of Technology and Management by automating the process of finding and assigning substitute teachers. It features a React/TypeScript frontend and a Node.js/Express backend.

## Project Overview

The application provides role-based access for Admins, Teachers, and Students, a real-time absence management dashboard, and a live timetable that reflects all changes instantly.

### Architecture
-   **Frontend**: React, TypeScript, Vite, Tailwind CSS.
-   **Backend**: Node.js, Express (with an in-memory database populated with real SMVITM data).
-   **AI Integration**: Google Gemini API for intelligent substitute teacher suggestions.

## Prerequisites

-   [Node.js](https://nodejs.org/) (v18.x or later recommended)
-   [npm](https://www.npmjs.com/) (comes with Node.js)

## Local Setup and Installation

1.  **Clone the repository or extract the files** into a project folder.

2.  **Create an Environment File**:
    Create a new file named `.env` in the root of your project folder. This file will hold your Gemini API Key.
    
    Add your API key to this file:
    ```
    API_KEY=YOUR_API_KEY_HERE
    ```

3.  **Install All Dependencies**:
    Open a terminal in the project's root directory and run:
    ```bash
    npm install
    ```
    This will install dependencies for both the frontend and backend.

4.  **Run the Application**:
    You need to run two processes in two **separate** terminals.

    *   **Terminal 1: Start the Backend Server**
        ```bash
        node server.js
        ```
        You should see a message: `Backend server running on http://localhost:3001`. Keep this terminal running.

    *   **Terminal 2: Start the Frontend Development Server**
        ```bash
        npm run dev
        ```
        This will start the React application, typically available at `http://localhost:5173`.

5.  **Access the Application**:
    Open your web browser and navigate to the frontend URL (e.g., `http://localhost:5173`). You can now use the application and its demo accounts.
