"use client";

import { useState } from "react";

interface NamespaceInputProps {
  onNamespaceSubmit: (namespace: string) => void;
  isLoading?: boolean;
}

export function NamespaceInput({ onNamespaceSubmit, isLoading }: NamespaceInputProps) {
  const [namespace, setNamespace] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (namespace.trim()) {
      onNamespaceSubmit(namespace.trim());
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Enter Namespace
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="namespace" className="block text-sm font-medium text-gray-700 mb-2">
            Namespace
          </label>
          <input
            id="namespace"
            type="text"
            value={namespace}
            onChange={(e) => setNamespace(e.target.value)}
            placeholder="Enter namespace (e.g., 'default', 'production')"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={!namespace.trim() || isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Loading..." : "Get Vectors"}
        </button>
      </form>
    </div>
  );
}
