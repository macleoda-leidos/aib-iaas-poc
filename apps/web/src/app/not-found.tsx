import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="text-3xl font-bold mb-3">Page Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="bg-gov-green text-white font-bold px-6 py-2.5 rounded no-underline hover:bg-green-800 text-sm">
            ← Go to Home
          </Link>
          <Link href="/admin" className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold px-6 py-2.5 rounded no-underline hover:bg-gray-300 dark:hover:bg-gray-600 text-sm">
            Admin Portal
          </Link>
          <Link href="/search" className="bg-blue-700 text-white font-bold px-6 py-2.5 rounded no-underline hover:bg-blue-800 text-sm">
            Search Cases
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-8">
          If you believe this is an error, please contact support at aib@aib.gov.uk
        </p>
      </div>
    </div>
  );
}
