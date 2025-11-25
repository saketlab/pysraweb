import { Badge, Card, Flex, Text } from "@radix-ui/themes";

export default function SimilarCard() {
  return (
    <Card style={{ maxWidth: "16rem" }} variant="surface">
      <Flex direction={"column"} justify={"start"} align={"start"} gap={"2"}>
        <Text weight={"bold"}>
          This is an example that is a bit long and very much wordy
        </Text>
        <Flex gap={"2"}>
          <Badge>SRP9999</Badge>
          <Badge color="gray">31 December 2020</Badge>
        </Flex>
      </Flex>
    </Card>
  );
}
