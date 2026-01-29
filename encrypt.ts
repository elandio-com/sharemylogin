/**
 * ShareMyLogin - Client-Side Encryption
 * 
 * This file handles all encryption. It runs entirely in your browser.
 * Your plaintext data and password NEVER leave your device.
 * 
 * Security: AES-256-GCM with PBKDF2 key derivation (250,000 iterations)
 */

export const PBKDF2_ITERATIONS = 250000;
export const SALT_LENGTH = 16;
export const IV_LENGTH = 12; // GCM standard

/**
 * Derives a cryptographic key from a password using PBKDF2.
 * @param password The user-provided password.
 * @param salt Random salt for key derivation.
 * @returns CryptoKey for AES-GCM encryption.
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        passwordBuffer,
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt as BufferSource,
            iterations: PBKDF2_ITERATIONS,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

/**
 * Encrypts data using AES-256-GCM with a password-derived key.
 * 
 * @param data The plaintext data to encrypt (usually JSON string).
 * @param password The password to encrypt with.
 * @returns Object containing ciphertext, iv, and salt (all base64 encoded).
 * 
 * Security notes:
 * - Fresh random salt and IV generated for each encryption
 * - AES-GCM provides both confidentiality and authenticity
 * - Auth tag is included in ciphertext (validated on decryption)
 */
export async function encryptData(data: string, password: string): Promise<{
    ciphertext: string;
    iv: string;
    salt: string;
}> {
    const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const key = await deriveKey(password, salt);
    const encoder = new TextEncoder();

    const encryptedContent = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        encoder.encode(data)
    );

    return {
        ciphertext: arrayBufferToBase64(encryptedContent),
        iv: uint8ArrayToBase64(iv),
        salt: uint8ArrayToBase64(salt),
    };
}

// --- Helper Functions ---

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function uint8ArrayToBase64(array: Uint8Array): string {
    return arrayBufferToBase64(array.buffer.slice(array.byteOffset, array.byteOffset + array.byteLength) as ArrayBuffer);
}
