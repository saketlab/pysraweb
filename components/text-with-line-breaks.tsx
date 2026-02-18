"use client";
import { Fragment } from "react";

const HTML_BREAK_TAG_REGEX = /<br\s*\/?>/gi;

export function normalizeLineBreakText(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(HTML_BREAK_TAG_REGEX, "\n");
}

export default function TextWithLineBreaks({ text }: { text: string }) {
  const lines = normalizeLineBreakText(text).split("\n");

  return (
    <>
      {lines.map((line, index) => (
        <Fragment key={index}>
          {line}
          {index < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </>
  );
}
