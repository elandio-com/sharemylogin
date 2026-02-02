import React, { useState, useEffect } from 'react';
import { encryptData } from '../crypto/encrypt';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

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
    const [turnstileToken] = useState('test-token');

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

            if (!res.ok) throw new Error('Failed to create secret. Is the backend running?');

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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Username / Email</label>
                                    <input
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="user@example.com"
                                        value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password / Secret</label>
                                    <input
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        type="text"
                                        placeholder="Secret value..."
                                        required
                                        value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">2FA / TOTP Code</label>
                                <input
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="e.g. 123 456"
                                    value={formData.twoFactor} onChange={e => setFormData({ ...formData, twoFactor: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL (Optional)</label>
                                <input
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="https://"
                                    value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    rows={3}
                                    placeholder="Any usage instructions..."
                                    value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Right Column: Settings */}
                        <div className="bg-gray-50 -my-8 -mr-8 p-8 border-l border-gray-100 flex flex-col justify-between">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Expiration</label>
                                    <div className="space-y-3">
                                        {[
                                            { id: 'one-time', label: '1 View (One-Time)', desc: 'Burns after reading' },
                                            { id: '24h', label: '24 Hours', desc: 'Expires in 1 day' },
                                            { id: '7d', label: '7 Days', desc: 'Expires in 1 week' }
                                        ].map((opt) => (
                                            <div key={opt.id} className="flex items-center">
                                                <input
                                                    id={opt.id}
                                                    name="expiry"
                                                    type="radio"
                                                    checked={expiry === opt.id}
                                                    onChange={() => setExpiry(opt.id)}
                                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                                                />
                                                <label htmlFor={opt.id} className="ml-3 block">
                                                    <span className="block text-sm font-medium text-gray-700">{opt.label}</span>
                                                    <span className="block text-xs text-gray-500">{opt.desc}</span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Password hidden in initial view for cleaner UX. Auto-generated in background. */}
                            </div>

                            {/* Inline Error Message */}
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                                    <p className="text-red-600 text-sm font-medium">{error}</p>
                                </div>
                            )}

                            <div className="mt-8">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white transition-all
                                        ${loading ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
                                >
                                    {loading ? 'Encrypting...' : 'Create Secret Link'}
                                </button>
                                <p className="mt-4 text-xs text-gray-400 text-center">
                                    Encryption happens in your browser. <br /> The server never sees the key.
                                </p>
                            </div>
                        </div>
                    </form>
                </div>
                <div className="text-center text-xs text-gray-400">
                    <p>Open Source Reference Client &bull; <a href="https://elandio.com" className="hover:text-gray-600 transition-colors">Elandio</a></p>
                </div>
            </div>
        </div>
    );
}
