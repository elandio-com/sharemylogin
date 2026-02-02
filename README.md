# ShareMyLogin - Reference Client

This repository contains the **Reference Client** and **Core Security Implementation** for [ShareMyLogin.com](https://sharemylogin.com).

## The "Trust Model"

This repository provides transparency into the encryption logic used by **ShareMyLogin.com**.

*   **Public Code (This Memo)**: The client-side code (`src/crypto/`) and logic here is identical to what runs on the production site.
*   **Hosted Service (ShareMyLogin.com)**: The hosted version uses this exact client code, wrapped in a branded UI with additional operational controls (Rate Limiting, CAPTCHA, Durable Database).

By open-sourcing the client, we allow security researchers and users to verify that **encryption happens locally** and keys are never sent to the server.

## Self-Hosting / Running Locally

This reference implementation includes a fully functional frontend and a **Reference In-Memory Backend**.
> **Note**: The backend in this repo is for testing/verification. It stores secrets in RAM, so they are lost if you restart the server.

### Prerequisites
*   Node.js 18+
*   npm

### Quick Start

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run Development Server**
    ```bash
    # Runs both Frontend (Vite) and Backend (Node) concurrently
    npm run dev & npm run server
    ```
    *   Frontend: `http://localhost:5173`
    *   Backend: `http://localhost:3001` (Reference API)

3.  **Build for Production**
    ```bash
    npm run build
    ```

## Project Structure

*   `src/crypto/`: The core encryption/decryption logic (Audit this!).
*   `src/pages/`: The UI logic that handles form submission.
*   `backend/`: A simple Node.js server reference implementation.
*   `backend/schema.sql`: The D1 Database schema used in production (if you want to implement a durable backend).

## License

MIT
