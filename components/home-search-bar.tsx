"use client";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Box, Flex, Text, TextField } from "@radix-ui/themes";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

enum searchType {
  NLPSearch,
  FilterSearch,
}

export default function HomeSearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    router.push(`/search?q=${encodeURIComponent(query)}`);
  };
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
          alt="pysradb logo"
          width={526}
          height={233}
          style={{
            width: "100%",
            height: "auto",
            backgroundColor: "transparent",
          }}
          unoptimized
        />
      </Box>
      <Text weight={"medium"} color="gray" size={{ initial: "1", md: "3" }}>
        Discover GEO & SRA datasets with natural language
      </Text>
      <Box width={{ initial: "85%", md: "60%" }}>
        <Flex direction={"column"} gap={"4"}>
          <form onSubmit={handleSubmit}>
            <TextField.Root
              size="3"
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            >
              <TextField.Slot>
                <MagnifyingGlassIcon height="16" width="16" />
              </TextField.Slot>
            </TextField.Root>
          </form>
        </Flex>
      </Box>
    </Flex>
  );
}
