# ShareMyLogin (Open Source)

This is the public source code for **[ShareMyLogin.com](https://sharemylogin.com)**.

## What is ShareMyLogin?

**ShareMyLogin** is a secure tool for sharing sensitive information (like passwords, API keys, or config secrets).

### The Problem
Sending a password over Slack, Email, or WhatsApp creates a permanent record of that secret in chat logs and servers. Even if you delete the message, it is often backed up elsewhere.

### The Solution
ShareMyLogin encrypts your secret **in your browser** before it ever leaves your device. It generates a unique link that you can send securely to anyone.
-   **Self-Destructs**: Can be set to delete immediately after it is viewed once (so only the intended recipient sees it).
-   **Zero Knowledge**: The server stores only encrypted data. The decryption key is part of the link (after the `#`) and is **never sent to the server**.

---

## Why is this code public?

Trust is critical for security tools. We open-sourced this code so you can verify exactly how it works:
1.  **Transparency**: You can inspect the `src/crypto/` folder to see the exact encryption logic used on the live site.
2.  **Verification**: You can run this project locally to confirm that your keys remain in your browser and are never logged by the network.

## The Trust Model

*   **Client-Side Encryption**: Uses `AES-256-GCM`. The key is generated in your browser.
*   **Encrypted Storage**: The server receives and stores only the encrypted blob (ciphertext).
*   **No Access**: Without the full link (which only you have), the data on our servers is useless to us or any attacker.

---

## How to Run Locally

You need to run both the frontend (User Interface) and the backend (API) to test the application.

### Prerequisites
*   Node.js 18+
*   npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Backend API
Open a terminal and run:
```bash
npm run server
# Server starts at http://localhost:3001
```

### 3. Start the Frontend UI
Open a **second terminal** and run:
```bash
npm run dev
# App opens at http://localhost:5173
```

### 4. Verify Security
1.  Open `http://localhost:5173`.
2.  Open your browser's **Developer Tools** (F12) and go to the **Network** tab.
3.  Create a secret.
4.  Click on the `create` request in the list.
5.  **Confirm**: The data sent is encrypted (`ciphertext`). Your real password/key is **not** included in the request body.

---

## Project Structure

*   `src/crypto/`: The core encryption/decryption logic.
*   `src/pages/`: The user interface code.
*   `backend/`: A minimal local server (Node.js) to mimic the production API for testing.

## License

MIT
