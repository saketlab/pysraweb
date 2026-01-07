"use client";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Box, Flex, TextField } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function HeroSearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    router.push(`/search?q=${encodeURIComponent(query)}`);
  };
  return (
    <Box width={{ initial: "85%", md: "60%" }}>
      <Flex direction={"column"} gap={"4"}>
        <form onSubmit={handleSubmit}>
          <TextField.Root
            aria-label="main search bar"
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
  );
}
