import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-6xl font-bold mb-4 text-blue-500">404</h1>
      <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Page Not Found</h2>
      <p className="text-[var(--text-secondary)] mb-8 text-center">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="flex items-center gap-2 px-6 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <Home className="w-4 h-4" />
        <span>Return Home</span>
      </Link>
    </div>
  );
};

export default NotFoundPage;
