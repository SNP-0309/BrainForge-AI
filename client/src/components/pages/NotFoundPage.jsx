import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
      <h1 className="text-9xl font-extrabold text-blue-500 tracking-widest">404</h1>
      <div className="bg-blue-600 px-2 text-sm rounded rotate-12 absolute">
        Page Not Found
      </div>
      <p className="text-slate-400 mt-4 mb-8">The page you are looking for doesn't exist or has been moved.</p>
      <Link to="/" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors">
        Go Back Home
      </Link>
    </div>
  );
}
