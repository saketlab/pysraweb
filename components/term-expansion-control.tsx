"use client";

// The toggle itself, shared by the two places that offer it: the navbar dialog
// (during a search) and the home page popover (before one).

import { Flex, Link, Switch, Text } from "@radix-ui/themes";

// lucide "waypoints"
export function WaypointsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="4.5" r="2.5" />
      <path d="m10.2 6.3-3.9 3.9" />
      <circle cx="4.5" cy="12" r="2.5" />
      <path d="M7 12h10" />
      <circle cx="19.5" cy="12" r="2.5" />
      <path d="m13.8 17.7 3.9-3.9" />
      <circle cx="12" cy="19.5" r="2.5" />
    </svg>
  );
}

export function TermExpansionRow({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <Flex align="center" justify="between" gap="4">
      <Text as="label" size="2" weight="medium" htmlFor="term-expansion-switch">
        Term expansion
      </Text>
      <Switch
        id="term-expansion-switch"
        checked={on}
        onCheckedChange={onChange}
      />
    </Flex>
  );
}

export function TermExpansionLearnMore() {
  return (
    <Text size="1" color="gray">
      To learn more about term expansion, read{" "}
      <Link href="/howsearchworks#expansion" target="_blank">
        <em>How search works</em>
      </Link>
      .
    </Text>
  );
}
