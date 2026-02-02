import React, { useState, useEffect } from 'react';
import { encryptData } from '../crypto/encrypt';
import { useDocumentTitle } from '../hooks/useDocumentTitle'; // Removed unused Turnstile import

// In production, this uses the real API. In this reference client, it uses the local in-memory server.
const API_BASE = '/api';

export function Create() {
    useDocumentTitle('Create Secret', 'Create a secure link.');

    const [formData, setFormData] = useState({
        service: '',
        url: '',
        username: '',
        password: '',
        twoFactor: '',
        notes: ''
    });

    const [accessPassword, setAccessPassword] = useState('');
    const [expiry, setExpiry] = useState('one-time');
    const [loading, setLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [error, setError] = useState('');

    // In reference client, we bypass turnstile logic if key is missing, or user can provide a dummy key
    const [turnstileToken, setTurnstileToken] = useState('test-token');

    useEffect(() => {
        generateNewPassword();
    }, []);

    const generateNewPassword = () => {
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let autoPass = '';
        const array = new Uint32Array(16);
        window.crypto.getRandomValues(array);
        for (let i = 0; i < 16; i++) {
            if (i > 0 && i % 4 === 0) autoPass += '-';
            autoPass += chars.charAt(array[i] % chars.length);
        }
        setAccessPassword(autoPass);
    };

    const handleEncrypt = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payloadString = JSON.stringify(formData);
            const { ciphertext, iv, salt } = await encryptData(payloadString, accessPassword);

            const res = await fetch(`${API_BASE}/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ciphertext,
                    iv,
                    salt,
                    expiryType: expiry,
                    turnstileToken
                })
            });

            if (!res.ok) throw new Error('Failed to create secret');

            const data = await res.json();
            const link = `${window.location.origin}/view/${data.id}#${data.destroyToken}`;
            setGeneratedLink(link);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (generatedLink) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
                <div className="max-w-xl w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900">Secret Created</h2>
                        <p className="mt-2 text-sm text-gray-500">Your secure link is ready to share.</p>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <label className="block text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Share this Link</label>
                            <input
                                readOnly
                                value={generatedLink}
                                className="w-full bg-white border border-blue-200 rounded px-3 py-2 text-sm font-mono text-gray-800 focus:outline-none"
                                onClick={(e) => e.currentTarget.select()}
                            />
                        </div>

                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                            <label className="block text-xs font-bold text-orange-700 uppercase tracking-wide mb-1">Unlock Password (Share Separately)</label>
                            <div className="relative">
                                <input
                                    readOnly
                                    value={accessPassword}
                                    className="w-full bg-white border border-orange-200 rounded px-3 py-2 text-lg font-mono font-bold text-orange-600 focus:outline-none tracking-wider"
                                    onClick={(e) => e.currentTarget.select()}
                                />
                            </div>
                            <p className="mt-2 text-xs text-orange-600/80">
                                This password is required to decrypt the secret. It is not stored on the server.
                            </p>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-colors"
                        >
                            Create Another Secret
                        </button>
                    </div>
                </div>
                <div className="mt-8 text-center text-xs text-gray-400">
                    <p>Developed by <a href="https://elandio.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors font-medium">Elandio</a></p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
            <div className="max-w-4xl w-full mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">New Secret Login</h1>
                    <p className="mt-2 text-lg text-gray-600">Zero-knowledge encryption for sharing sensitive data.</p>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <form onSubmit={handleEncrypt} className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Form Fields */}
                        <div className="lg:col-span-2 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Service / Application</label>
                                <input
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="e.g. AWS Root"
                                    value={formData.service} onChange={e => setFormData({ ...formData, service: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                    <input
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="user@example.com"
                                        value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="Secret Password"
                                        value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL (Optional)</label>
                                    <input
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                                        placeholder="https://"
                                        value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">2FA / TOTP (Optional)</label>
                                    <input
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm tracking-widest"
                                        placeholder="000 000"
                                        value={formData.twoFactor} onChange={e => setFormData({ ...formData, twoFactor: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-32 resize-y"
                                    placeholder="Any additional instructions..."
                                    value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Right Column: Settings */}
                        <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-8 pt-6 lg:pt-0 space-y-6">
                            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Settings</h3>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiration</label>
                                    <select
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                                        value={expiry} onChange={e => setExpiry(e.target.value)}
                                    >
                                        <option value="one-time">1 View (Self-Destruct)</option>
                                        <option value="24h">24 Hours</option>
                                        <option value="7d">7 Days</option>
                                    </select>
                                </div>

                                <div className="text-xs text-gray-500 space-y-2">
                                    <p className="flex items-start gap-2">
                                        <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                        passwords auto-generated
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                        encrypted locally (AES-256)
                                    </p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Encrypting...' : 'Encrypt & Share'}
                            </button>
                            {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}
                        </div>
                    </form>
                </div>

                <div className="text-center text-xs text-gray-400">
                    <p>Developed by <a href="https://elandio.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors font-medium">Elandio</a></p>
                </div>
            </div>
        </div>
    );
}
