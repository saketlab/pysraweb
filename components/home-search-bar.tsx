"use client";

import { Box, Flex } from "@radix-ui/themes";
import { useTheme } from "next-themes";
import Image from "next/image";
import HeroSearchBar from "./hero-search-bar";

export default function HomeSearchBar() {
  const { resolvedTheme } = useTheme();

  return (
    <Flex
      justify="center"
      align="center"
      direction="column"
      gap="4"
      mt={{ initial: "4rem" }}
    >
      <Box
        pb={"3"}
        width={{ initial: "26rem", md: "20rem", lg: "28rem" }}
        style={{ position: "relative", aspectRatio: "619/103" }}
      >
        <Image
          src={resolvedTheme === "light" ? "/logo-light.png" : "/logo-dark.png"}
          alt="seqout"
          fill
          style={{ objectFit: "contain" }}
        />
      </Box>

      <HeroSearchBar />
    </Flex>
  );
}
