import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Link, Popover, Text } from "@radix-ui/themes";

export default function InfoPopOver({ infoText }: { infoText: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger>
        <InfoCircledIcon style={{ paddingRight: "0.5rem" }} />
      </Popover.Trigger>
      <Popover.Content width="360px">
        <Text size="2">
          {infoText}. Read <Link href="#">our paper</Link> to learn more.
        </Text>
      </Popover.Content>
    </Popover.Root>
  );
}
