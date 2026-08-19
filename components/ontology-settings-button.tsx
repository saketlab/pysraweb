"use client";

// Gear beside the term expansion switch: which ontologies may contribute
// synonyms. Switching one off drops synonyms attributable to it alone — terms
// are merged by name, so a disease that carries MONDO *and* MeSH ids survives
// MeSH being off.

import { ONTOLOGIES } from "@/utils/termExpansion";
import { GearIcon } from "@radix-ui/react-icons";
import {
  Dialog,
  Flex,
  IconButton,
  Separator,
  Switch,
  Text,
  Tooltip,
} from "@radix-ui/themes";

export default function OntologySettingsButton({
  disabled,
  onChange,
}: {
  /** Ontology ids currently switched off. */
  disabled: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (id: string, on: boolean) =>
    onChange(on ? disabled.filter((d) => d !== id) : [...disabled, id]);

  return (
    <Dialog.Root>
      <Tooltip content="Ontology sources">
        <Dialog.Trigger>
          <IconButton
            variant="ghost"
            color="gray"
            size="1"
            aria-label="Ontology sources"
          >
            <GearIcon />
          </IconButton>
        </Dialog.Trigger>
      </Tooltip>
      <Dialog.Content size="3">
        <Dialog.Title size="3">Ontology sources</Dialog.Title>
        <Dialog.Description size="1" color="gray" mb="3">
          Synonyms come from these eight ontologies. Switch one off to keep its
          synonyms out of your searches.
        </Dialog.Description>
        <Separator size="4" mb="3" />
        <Flex direction="column" gap="3">
          {ONTOLOGIES.map((o) => (
            <Flex key={o.id} align="center" justify="between" gap="4">
              <Flex direction={"column"}>
                <Text as="label" size="2" htmlFor={`ontology-${o.id}`}>
                  {o.label}
                </Text>
                <Text size={"1"} color="gray">
                  {o.description}
                </Text>
              </Flex>
              <Switch
                id={`ontology-${o.id}`}
                checked={!disabled.includes(o.id)}
                onCheckedChange={(on) => toggle(o.id, on)}
              />
            </Flex>
          ))}
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
