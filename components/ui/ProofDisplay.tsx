"use client";

import ProofText from "./ProofText";
import { getIpfsUrl, isIpfsHash } from "@/lib/kwest/pinata";
import { useState } from "react";

interface ProofData {
  text?: string;
  images?: string[];
}

function parseProofData(raw: string): ProofData {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && (parsed.text || parsed.images)) {
      return parsed as ProofData;
    }
  } catch {}
  return { text: raw };
}

export default function ProofDisplay({ data }: { data: string }) {
  const proof = parseProofData(data);

  return (
    <div className="space-y-3">
      {proof.text && (
        <div className="text-sm text-slate-300">
          <ProofText text={proof.text} />
        </div>
      )}
      {proof.images && proof.images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {proof.images.map((hash, i) => (
            <ProofImage key={i} hash={hash} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProofImage({ hash }: { hash: string }) {
  const [expanded, setExpanded] = useState(false);
  const url = getIpfsUrl(hash);

  return (
    <>
      <img
        src={url}
        alt="Proof image"
        className="rounded-lg border border-slate-700 max-h-48 w-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setExpanded(true)}
        loading="lazy"
      />
      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpanded(false)}
        >
          <img
            src={url}
            alt="Proof image"
            className="max-w-full max-h-[90vh] rounded-lg object-contain"
          />
        </div>
      )}
    </>
  );
}
