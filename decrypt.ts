/**
 * ShareMyLogin - Client-Side Decryption
 * 
 * This file handles all decryption. It runs entirely in your browser.
 * Your plaintext data is ONLY accessible in your browser memory.
 * The password is NEVER sent to any server.
 * 
 * Security: AES-256-GCM automatically validates the authentication tag,
 * ensuring data integrity and authenticity.
 */

import {
    PBKDF2_ITERATIONS,
    MIN_PASSWORD_LENGTH,
    HASH_ALGORITHM,
    AES_KEY_LENGTH,
    KDF_ALGORITHM,
    ENCRYPTION_ALGORITHM
} from './encrypt';

/**
 * Decrypts data using AES-256-GCM with a password-derived key.
 * 
 * @param ciphertext Base64-encoded encrypted data.
 * @param password The password to decrypt with.
 * @param ivBase64 Base64-encoded initialization vector.
 * @param saltBase64 Base64-encoded salt.
 * @returns Decrypted plaintext string.
 * @throws Error if password is wrong or data is corrupted.
 * 
 * Security notes:
 * - AES-GCM validates the auth tag (included in ciphertext)
 * - Invalid password or tampered data will throw an error
 * - Plaintext only exists in browser memory during this call
 */
export async function decryptData(
    ciphertext: string,
    password: string,
    ivBase64: string,
    saltBase64: string
): Promise<string> {
    // Validate required parameters
    if (!ciphertext || !password || !ivBase64 || !saltBase64) {
        throw new Error("Missing required parameters for decryption");
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
        throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    const salt = base64ToUint8Array(saltBase64);
    const iv = base64ToUint8Array(ivBase64);
    const encryptedData = base64ToArrayBuffer(ciphertext);

    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        passwordBuffer,
        { name: KDF_ALGORITHM },
        false,
        ["deriveKey"]
    );

    const key = await window.crypto.subtle.deriveKey(
        {
            name: KDF_ALGORITHM,
            salt: salt as BufferSource,
            iterations: PBKDF2_ITERATIONS,
            hash: HASH_ALGORITHM,
        },
        keyMaterial,
        { name: ENCRYPTION_ALGORITHM, length: AES_KEY_LENGTH },
        false,
        ["decrypt"]
    );

    try {
        // AES-GCM decryption automatically validates the authentication tag.
        // If the password is wrong or data was tampered, this will throw.
        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: ENCRYPTION_ALGORITHM,
                iv: iv as BufferSource,
            },
            key,
            encryptedData
        );

        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (e) {
        // Log the original error for debugging (without exposing sensitive data)
        console.error('[Decryption Error]', e instanceof Error ? e.name : 'Unknown error');

        // User-friendly message without leaking sensitive information
        if (e instanceof DOMException && e.name === 'OperationError') {
            throw new Error("Incorrect password or corrupted data");
        }
        throw new Error("Decryption failed. Please verify your inputs and try again.");
    }
}

// --- Helper Functions ---

function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const arr = base64ToUint8Array(base64);
    return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer;
}
