import React, { useState } from 'react';

interface LoginProps {
    onLogin: (email: string, pass: string) => Promise<boolean>;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const success = await onLogin(email, password);
            if (!success) {
                setError('Invalid email or password.');
            }
        } catch (err) {
            setError('An error occurred during login. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const fillDemoCredentials = (emailToFill: string, passToFill: string) => {
        setEmail(emailToFill);
        setPassword(passToFill);
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                     <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-primary">
                        Intelligent Timetable System
                    </h1>
                    <p className="text-gray-600 mt-2">Please sign in to access your dashboard.</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password"  className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                         {error && <p className="text-sm text-red-600">{error}</p>}
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Signing in...</span>
                                    </div>
                                ) : 'Sign in'}
                            </button>
                        </div>
                    </form>
                </div>
                 <div className="mt-6 bg-blue-50 p-4 rounded-lg text-sm text-gray-700">
                    <h4 className="font-semibold mb-2 text-brand-dark">Demo Accounts (password: `password` or `admin`)</h4>
                    <ul className="list-disc list-inside space-y-1">
                        <li><button onClick={() => fillDemoCredentials('admin@school.edu', 'admin')} className="text-blue-600 hover:underline">Admin Login</button></li>
                        <li><button onClick={() => fillDemoCredentials('hod.math@school.edu', 'password')} className="text-blue-600 hover:underline">HOD Login</button></li>
                        <li><button onClick={() => fillDemoCredentials('jsmith@school.edu', 'password')} className="text-blue-600 hover:underline">Teacher Login</button></li>
                        <li><button onClick={() => fillDemoCredentials('student@school.edu', 'password')} className="text-blue-600 hover:underline">Student Login</button></li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Login;
