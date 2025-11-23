"use client";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Flex, TextField } from "@radix-ui/themes";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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
      flexGrow="1"
      justify="center"
      align="center"
      direction="column"
      gap="4"
      style={{ transform: "translateY(-8%)" }}
    >
      <Image
        src="/pysradb_v3.png"
        alt="pysradb logo"
        width={233}
        height={103}
      />
      <form onSubmit={handleSubmit} style={{ width: "60%" }}>
        <TextField.Root
          placeholder="Start typing..."
          size="3"
          onChange={(e) => setQuery(e.target.value)}
        >
          <TextField.Slot>
            <MagnifyingGlassIcon height="16" width="16" />
          </TextField.Slot>
        </TextField.Root>
      </form>
    </Flex>
  );
}
