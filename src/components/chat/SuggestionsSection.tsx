"use client";

import { ArrowRight } from "lucide-react";

export const SuggestionsSection = ({
  suggestions,
  onClick,
}: {
  suggestions: string[];
  onClick: (suggestion: string) => void;
}) => {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-3xl bg-white">
      <div className="space-y-2">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          Suggested questions
        </h2>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onClick(suggestion)}
            className="group flex w-full items-start justify-between border-b border-gray-200 px-1 py-2 text-left hover:bg-gray-50"
          >
            <span className="flex-grow pr-4 text-gray-700 group-hover:text-gray-900">
              {suggestion}
            </span>
            <ArrowRight className="mt-1 h-5 w-5 flex-shrink-0 text-gray-400" />
          </button>
        ))}
      </div>
    </div>
  );
};
