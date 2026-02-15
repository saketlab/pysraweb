import { Box, Flex, Text } from "@radix-ui/themes";
import HeroSearchBar from "./hero-search-bar";
import Logo from "./logo";

export default function HomeSearchBar() {
  return (
    <Flex
      justify="center"
      align="center"
      direction="column"
      gap="4"
      mt={{ initial: "4rem" }}
    >
      <Box pb={"3"}>
        <Logo
          style={{ width: "min(22rem, 80vw)", height: "auto" }}
          priority
        />
      </Box>
      <Text
        weight={"medium"}
        color="gray"
        size={{ initial: "1", md: "3" }}
        style={{ userSelect: "none" }}
      >
        Discover GEO & SRA datasets
      </Text>
      <HeroSearchBar />
    </Flex>
  );
}
