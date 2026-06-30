export default function NotFound() {
  return (
    <div className="gov-main text-center py-16">
      <h1 className="text-4xl font-bold mb-4">Page not found</h1>
      <p className="text-lg text-gray-600 mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <a
        href="/"
        className="inline-block bg-gov-green text-white font-bold py-3 px-8 no-underline hover:bg-green-800"
      >
        Go to homepage
      </a>
    </div>
  );
}
