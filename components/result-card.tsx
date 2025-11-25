import { Experiment } from "@/utils/types";
import { Badge, Card, Flex, Separator, Text } from "@radix-ui/themes";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type ResultCardProps = {
  experiments: Experiment[];
  studyAcc: string;
};

export default function ResultCard({ studyAcc, experiments }: ResultCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleClick = () => {
    queryClient.setQueryData(["experiments", studyAcc], experiments);
    router.push(`/project?srp=${studyAcc}`);
  };
  const experimentTitle = experiments[0].experiment_title;
  const numExperiments = experiments.length;

  return (
    <Card variant="surface" style={{ width: "85%" }}>
      <Flex direction={"column"} gap={"2"}>
        <Flex justify={"between"} align={"center"}>
          <Text
            size={"5"}
            weight={"medium"}
            style={{ cursor: "pointer", width: "100%" }}
            onClick={handleClick}
          >
            {experimentTitle}
          </Text>
          <Badge size={"2"}>{studyAcc}</Badge>
        </Flex>
        <Flex gap={"2"} align={"center"}>
          <Badge color="gray">20th October, 2020</Badge>
          <Separator orientation={"vertical"} />
          <Text>{numExperiments} Experiments</Text>
        </Flex>
      </Flex>
    </Card>
  );
}
