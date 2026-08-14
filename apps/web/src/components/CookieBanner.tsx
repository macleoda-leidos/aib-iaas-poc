'use client';

import { useState, useEffect } from 'react';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="bg-gov-light-grey border-b-2 border-gov-blue" role="region" aria-label="Cookie banner">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <h2 className="font-bold text-sm mb-1">Cookies on AiB IAAS</h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              We use some essential cookies to make this service work. We'd also like to use analytics cookies so we can
              understand how you use the service and make improvements.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={accept}
              className="bg-green-700 text-white text-sm font-bold px-4 py-2 hover:bg-green-800">
              Accept analytics cookies
            </button>
            <button onClick={reject}
              className="bg-gray-200 text-gray-900 text-sm font-bold px-4 py-2 hover:bg-gray-300">
              Reject analytics cookies
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
