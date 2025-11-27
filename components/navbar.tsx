"use client";
import { Flex, Link } from "@radix-ui/themes";
import GitHubButton from "./github-button";
import ThemeToggle from "./theme-toggle";

export default function Navabar() {
  return (
    <Flex style={{ zIndex: 10 }} justify="between" align="center" p="3">
      <Flex gap={"4"} align={"center"}>
        <Link href="https://saket-choudhary.me/pysradb/index.html">Docs</Link>
        <Link href="#">Paper</Link>
      </Flex>
      <Flex gap={"4"} align={"center"}>
        <ThemeToggle />
        <Link href="https://saketlab.in/">Saket Lab</Link>
        <GitHubButton />
      </Flex>
    </Flex>
  );
}
