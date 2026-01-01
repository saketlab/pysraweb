"use client";
import { Link, Text } from "@radix-ui/themes";
import { useState } from "react";

type ProjectSummaryProps = {
  text?: string | null;
  charLimit?: number;
};

export default function ProjectSummary({
  text,
  charLimit = 350,
}: ProjectSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const shouldTruncate = text.length > charLimit;
  const display =
    expanded || !shouldTruncate ? text : `${text.slice(0, charLimit)}...`;

  return (
    <Text>
      {display}
      {shouldTruncate && (
        <Link
          ml="1"
          style={{ cursor: "pointer" }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "less" : "more"}
        </Link>
      )}
    </Text>
  );
}
