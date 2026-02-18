import { Badge, Card, Flex, Text } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { getProjectShortUrl } from "@/utils/shortUrl";

type ResultCardProps = {
  accesssion: string;
  title: string | null;
  summary: string | null;
  updated_at: string | null;
};

export default function ResultCard({
  accesssion,
  title,
  summary,
  updated_at,
}: ResultCardProps) {
  const router = useRouter();
  const isArrayExpressAccession = accesssion.toUpperCase().startsWith("E-");

  const handleClick = () => {
    router.push(getProjectShortUrl(accesssion));
  };

  return (
    <Card>
      <Flex direction={"column"} gap={"2"}>
        <Text
          size={{ initial: "2", md: "3" }}
          weight={"bold"}
          style={{ cursor: "pointer", width: "100%", userSelect: "none" }}
          onClick={handleClick}
        >
          {title}
        </Text>
        <Text size={"2"} truncate>
          {summary}
        </Text>
        <Flex gap={"2"} align={"center"}>
          <Badge
            size={"2"}
            color={
              isArrayExpressAccession
                ? "iris"
                : accesssion.startsWith("G")
                  ? undefined
                  : "brown"
            }
            variant={isArrayExpressAccession ? "solid" : undefined}
          >
            {accesssion}
          </Badge>
          <Badge color="gray">
            Last updated on{" "}
            {updated_at
              ? new Date(updated_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : null}
          </Badge>
        </Flex>
      </Flex>
    </Card>
  );
}
