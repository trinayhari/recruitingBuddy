"use client";

import { useState, FormEvent } from "react";
import InlineAlert from "../InlineAlert";

interface CreateAssessmentFormProps {
  onSuccess: (assessment: {
    id: string;
    shareableToken: string;
    shareableLink: string;
  }) => void;
  onCancel: () => void;
}

export default function CreateAssessmentForm({
  onSuccess,
  onCancel,
}: CreateAssessmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Assessment title is required");
      return;
    }

    if (!content.trim()) {
      setError("Assessment content is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create assessment");
      }

      const data = await response.json();
      onSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6">
      <h2 className="text-h2 font-semibold mb-4 text-neutral-900">
        Create New Assessment
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="assessment-title"
            className="block text-body-sm font-medium mb-2 text-neutral-900"
          >
            Assessment Title{" "}
            <span className="text-neutral-500 font-normal">(required)</span>
          </label>
          <input
            type="text"
            id="assessment-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Frontend Developer Take-Home"
            className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg bg-white text-body text-neutral-900 placeholder:text-neutral-400 focus:border-primary-600 focus:outline-none focus:ring-3 focus:ring-primary-600/12 transition-all duration-base disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed"
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <label
            htmlFor="assessment-content"
            className="block text-body-sm font-medium mb-2 text-neutral-900"
          >
            Assessment Requirements{" "}
            <span className="text-neutral-500 font-normal">(required)</span>
          </label>
          <textarea
            id="assessment-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste the project requirements/prompt here..."
            rows={10}
            className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg bg-white text-body text-neutral-900 placeholder:text-neutral-400 focus:border-primary-600 focus:outline-none focus:ring-3 focus:ring-primary-600/12 transition-all duration-base disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed resize-y"
            disabled={isSubmitting}
            required
          />
        </div>

        {error && (
          <InlineAlert variant="error">
            <p className="text-body-sm">{error}</p>
          </InlineAlert>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-primary-600 text-white py-2.5 px-6 rounded-lg font-medium text-body hover:bg-primary-700 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed transition-all duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
          >
            {isSubmitting ? "Creating..." : "Create Assessment"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-2.5 border border-neutral-300 rounded-lg font-medium text-body text-neutral-700 hover:bg-neutral-50 disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed transition-all duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
