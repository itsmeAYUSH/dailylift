import React from "react";

interface StructuredDataProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

/**
 * StructuredData component to inject JSON-LD schema markup for SEO & AEO.
 */
export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
