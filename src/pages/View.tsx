import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { decryptData } from '../crypto/decrypt';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const API_BASE = '/api';

export function View() {
    useDocumentTitle('View Secret', 'Securely view secret.');
    const { id } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [decrypted, setDecrypted] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState<any>(null);
    const [destroyToken, setDestroyToken] = useState(() => window.location.hash.slice(1));

    useEffect(() => {
        fetch(`${API_BASE}/view/${id}`)
            .then(r => {
                if (!r.ok) throw new Error('Secret not found');
                return r.json();
            })
            .then(data => {
                setMeta(data);
                setLoading(false);
            })
            .catch(e => {
                setError(e.message);
                setLoading(false);
            });
    }, [id]);

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Prepare headers
            const headers: any = { 'Content-Type': 'application/json' };
            if (destroyToken) headers['X-Destroy-Token'] = destroyToken;

            // 1. Get Ciphertext
            const res = await fetch(`${API_BASE}/reveal/${id}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({})
            });

            if (!res.ok) throw new Error('Failed to retrieve data');
            const secretData = await res.json();

            // 2. Decrypt locally
            const plaintext = await decryptData(secretData.ciphertext, password, secretData.iv, secretData.salt);
            setDecrypted(plaintext);

            // 3. Report Success (if needed for attempts logic, simplified here)
            await fetch(`${API_BASE}/attempt/${id}`, { method: 'POST', body: JSON.stringify({}) });

        } catch (err: any) {
            // Report Failure
            await fetch(`${API_BASE}/attempt/${id}`, { method: 'POST', body: JSON.stringify({}) });
            setError('Decryption failed or secret destroyed.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error && !decrypted) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Secret Unavailable</h2>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        Create New Secret
                    </button>
                    <div className="mt-8 text-center text-xs text-gray-400">
                        <p>Developed by <a href="https://elandio.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors font-medium">Elandio</a></p>
                    </div>
                </div>
            </div>
        );
    }

    if (decrypted) {
        let structured: any = null;
        try { structured = JSON.parse(decrypted); } catch (e) { }

        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
                <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Decrypted Successfully</h2>
                            <p className="text-sm text-gray-500 mt-1">Data exists only in your browser memory.</p>
                        </div>

                        {structured ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {structured.service && (
                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1">Service</label>
                                            <div className="font-semibold text-gray-900 truncate" title={structured.service}>{structured.service}</div>
                                        </div>
                                    )}
                                    {structured.username && (
                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1">Username</label>
                                            <div className="text-gray-900 truncate" title={structured.username}>{structured.username}</div>
                                        </div>
                                    )}
                                </div>

                                {structured.url && (
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-1">URL</label>
                                        <a href={structured.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{structured.url}</a>
                                    </div>
                                )}

                                {structured.password && (
                                    <div className="p-6 bg-blue-50 rounded-xl border border-blue-100 text-center">
                                        <label className="text-xs font-bold uppercase tracking-wide text-blue-600 block mb-2">Password / Secret</label>
                                        <div className="text-3xl font-mono font-bold text-gray-900 select-all break-all tracking-wider">{structured.password}</div>
                                    </div>
                                )}

                                {structured.twoFactor && (
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
                                        <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block">2FA Code</label>
                                        <div className="text-xl font-mono font-bold text-gray-900 tracking-widest">{structured.twoFactor}</div>
                                    </div>
                                )}

                                {structured.notes && (
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <label className="text-xs font-bold uppercase tracking-wide text-gray-500 block mb-2">Notes</label>
                                        <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">{structured.notes}</pre>
                                    </div>
                                )}

                                {meta && (meta.ttlMode === '24h' || meta.ttlMode === '7d') && (
                                    <div className="p-3 bg-blue-50 text-blue-800 text-xs text-center rounded border border-blue-100">
                                        This secret is valid for <strong>{meta.ttlMode}</strong> (or until manually deleted).
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 overflow-auto max-h-96">
                                <pre className="font-mono text-sm text-gray-800 whitespace-pre-wrap">{decrypted}</pre>
                            </div>
                        )}

                        <div className="mt-8 space-y-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-bold rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
                            >
                                Clear Screen
                            </button>

                            {destroyToken && (
                                <button
                                    onClick={async () => {
                                        if (!confirm('Are you sure you want to permanently delete this secret? It will be gone forever.')) return;
                                        try {
                                            const res = await fetch(`${API_BASE}/destroy/${id}`, {
                                                method: 'DELETE',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ destroyToken })
                                            });
                                            if (res.ok || res.status === 404) {
                                                alert('Secret deleted (or was already gone).');
                                                navigate('/');
                                            } else {
                                                alert('Failed to delete. Token might be invalid.');
                                            }
                                        } catch (e) { alert('Error contacting server.'); }
                                    }}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none transition-colors"
                                >
                                    Delete Permanently
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="mt-8 text-center text-xs text-gray-400">
                    <p>Developed by <a href="https://elandio.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors font-medium">Elandio</a></p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-8">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-6">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-bold text-gray-900">Unlock Secret</h2>
                        <p className="text-sm text-gray-500 mt-1">Enter password to decrypt</p>
                    </div>

                    <form onSubmit={handleUnlock} className="space-y-6">
                        <div>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Password"
                                className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg text-center font-bold text-lg placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                        >
                            Unlock
                        </button>
                    </form>
                </div>
            </div>
            <div className="mt-8 text-center text-xs text-gray-400">
                <p>Developed by <a href="https://elandio.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors font-medium">Elandio</a></p>
            </div>
        </div>
    );
}
