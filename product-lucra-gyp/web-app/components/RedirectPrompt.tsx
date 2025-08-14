"use client";
import { useRedirect } from "../contexts/RedirectContext";

export default function RedirectPrompt() {
  const { redirectUrl, showRedirectPrompt, handleRedirectResponse } = useRedirect();

  if (!showRedirectPrompt || !redirectUrl) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <i className="ri-share-line text-blue-600 text-xl"></i>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-blue-800 mb-1">
            Shared Lucra Content
          </h3>
          <p className="text-sm text-blue-700 mb-2">
            Someone shared a Lucra link with you. Would you like to view it?
          </p>
          <div className="bg-blue-100 rounded-lg p-2 mb-3">
            <p className="text-xs text-blue-600 font-mono truncate">
              {redirectUrl}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleRedirectResponse(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Yes, Open Link
            </button>
            <button
              onClick={() => handleRedirectResponse(false)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              No, Thanks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}