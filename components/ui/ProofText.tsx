"use client";

import { Fragment } from "react";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export default function ProofText({ text }: { text: string }) {
  const parts = text.split(URL_REGEX);
  return (
    <span className="break-all whitespace-pre-wrap">
      {parts.map((part, i) =>
        URL_REGEX.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
          >
            {part}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </span>
  );
}
