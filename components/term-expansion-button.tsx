"use client";

// Home-page twin of the navbar's expansion button. There's no search to explain
// yet, so it's just the toggle: it sets the default the next search runs with.

import {
  TermExpansionLearnMore,
  TermExpansionRow,
  WaypointsIcon,
} from "@/components/term-expansion-control";
import { Flex, IconButton, Popover, Tooltip } from "@radix-ui/themes";

export default function TermExpansionButton({
  on,
  onChange,
  disabledOntologies,
  onChangeOntologies,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
  disabledOntologies: string[];
  onChangeOntologies: (next: string[]) => void;
}) {
  return (
    <Popover.Root>
      <Tooltip content="Term expansion">
        <Popover.Trigger>
          <IconButton
            variant="soft"
            color="gray"
            size="3"
            aria-label="Term expansion"
          >
            <WaypointsIcon />
          </IconButton>
        </Popover.Trigger>
      </Tooltip>
      <Popover.Content size="1" style={{ width: "17rem" }}>
        <Flex direction="column" gap="2">
          <TermExpansionRow
            on={on}
            onChange={onChange}
            disabledOntologies={disabledOntologies}
            onChangeOntologies={onChangeOntologies}
          />
          <TermExpansionLearnMore />
        </Flex>
      </Popover.Content>
    </Popover.Root>
  );
}
