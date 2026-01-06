import { Box, Flex, Text } from "@radix-ui/themes";
import Image from "next/image";
import HeroSearchBar from "./hero-search-bar";

export default function HomeSearchBar() {
  return (
    <Flex
      justify="center"
      align="center"
      direction="column"
      gap="4"
      mt={{ initial: "4rem" }}
    >
      <Box width={"12rem"}>
        <Image
          src="/pysradb_v3.png"
          draggable={"false"}
          loading="eager"
          alt="pysradb logo"
          width={526}
          height={233}
          style={{
            width: "100%",
            height: "auto",
            backgroundColor: "transparent",
          }}
          unoptimized // necessary for transparency
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
