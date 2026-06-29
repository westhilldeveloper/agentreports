'use client';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800">404</h1>
        <p className="text-gray-600 mt-2">Page not found</p>
        <a href="/" className="mt-4 inline-block text-blue-600 hover:underline">
          Go home
        </a>
      </div>
    </div>
  );
}