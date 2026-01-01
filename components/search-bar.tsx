"use client";
import GitHubButton from "@/components/github-button";
import ThemeToggle from "@/components/theme-toggle";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Box, Flex, TextField } from "@radix-ui/themes";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface SearchBarProps {
  initialQuery?: string | null;
}

export default function SearchBar({ initialQuery }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  return (
    <Flex
      justify={{ initial: "center", sm: "between" }}
      align="center"
      p={{ initial: "0", sm: "3" }}
      pb={"3"}
      gap={"4"}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 1px 0 rgba(0,0,0,0.06)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        backgroundColor: "transparent",
      }}
    >
      <Flex
        gap={{ initial: "2", sm: "4" }}
        align={"center"}
        flexGrow={"1"}
        direction={{ initial: "column", md: "row" }}
      >
        <Link href={"/"} style={{ width: "6.2rem" }}>
          <Image
            src="/pysradb_v3.png"
            alt="pysradb logo"
            width={116}
            height={50}
            style={{
              width: "100%",
              height: "auto",
              backgroundColor: "transparent",
            }}
            unoptimized
          />
        </Link>
        <Box width={{ initial: "85%", md: "70%" }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery) {
                window.location.href = `/search?q=${encodeURIComponent(
                  searchQuery
                )}`;
              }
            }}
          >
            <TextField.Root
              size={"3"}
              onChange={(e) => setSearchQuery(e.target.value)}
              value={searchQuery ?? ""}
            >
              <TextField.Slot>
                <MagnifyingGlassIcon height="16" width="16" />
              </TextField.Slot>
            </TextField.Root>
          </form>
        </Box>
      </Flex>
      <Flex
        gap={"3"}
        align={"center"}
        display={{ initial: "none", md: "flex" }}
      >
        <ThemeToggle />
        <GitHubButton />
      </Flex>
    </Flex>
  );
}
