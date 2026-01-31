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
    // Note: We deliberately DO NOT check password length here (unlike encryption).
    // This allows old secrets (created before 16-char policy) to still be decrypted.

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
        // Human-friendly error for wrong password
        if (e instanceof DOMException && e.name === 'OperationError') {
            throw new Error("Incorrect password or corrupted data");
        }
        // Generic fall-through
        console.error('[Decryption Error]', e);
        throw new Error("Decryption failed. Please verify your inputs.");
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
