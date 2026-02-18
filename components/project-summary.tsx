"use client";
import { Link, Text } from "@radix-ui/themes";
import { useState } from "react";
import TextWithLineBreaks, {
  normalizeLineBreakText,
} from "@/components/text-with-line-breaks";

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
  const normalizedText = normalizeLineBreakText(text);

  const shouldTruncate = normalizedText.length > charLimit;
  const display =
    expanded || !shouldTruncate
      ? normalizedText
      : `${normalizedText.slice(0, charLimit)}...`;

  return (
    <Text>
      <TextWithLineBreaks text={display} />
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
