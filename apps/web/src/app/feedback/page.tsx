'use client';

import { useState } from 'react';

export default function FeedbackPage() {
  const [rating, setRating] = useState<number | null>(null);
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">Thank you for your feedback</h1>
          <p className="text-gray-700 dark:text-gray-300">
            Your feedback helps us improve this service. We review all submissions and use them to prioritise improvements.
          </p>
          <a href="/" className="inline-block mt-4 text-blue-700 underline">Return to home page</a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Give feedback on this service</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        This is a new service. Your feedback will help us improve it.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Satisfaction rating */}
        <fieldset>
          <legend className="font-bold text-lg mb-3">Overall, how did you feel about the service you received today?</legend>
          <div className="space-y-2">
            {[
              { value: 5, label: 'Very satisfied' },
              { value: 4, label: 'Satisfied' },
              { value: 3, label: 'Neither satisfied nor dissatisfied' },
              { value: 2, label: 'Dissatisfied' },
              { value: 1, label: 'Very dissatisfied' },
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                <input
                  type="radio"
                  name="rating"
                  value={opt.value}
                  checked={rating === opt.value}
                  onChange={() => setRating(opt.value)}
                  className="w-5 h-5"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Details */}
        <div>
          <label htmlFor="feedback-details" className="block font-bold mb-1">
            How could we improve this service?
          </label>
          <p className="text-sm text-gray-500 mb-2">Do not include any personal or financial information.</p>
          <textarea
            id="feedback-details"
            value={details}
            onChange={e => setDetails(e.target.value)}
            rows={5}
            className="border-2 border-gray-900 dark:border-gray-600 dark:bg-gray-800 p-3 w-full text-base focus:outline-2 focus:outline-yellow-400"
            placeholder="Tell us what you think..."
          />
        </div>

        {/* Submit */}
        <button type="submit"
          className="bg-green-700 text-white font-bold py-3 px-8 hover:bg-green-800 border-b-2 border-green-900">
          Send feedback
        </button>
      </form>
    </div>
  );
}
