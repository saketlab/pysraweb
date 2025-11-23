"use client";
import HomeSearchBar from "@/components/home-search-bar";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Button, Flex, Link } from "@radix-ui/themes";
import { redirect } from "next/navigation";

export default function Home() {
  return (
    <Flex style={{ height: "100svh" }} direction="column">
      <Flex
        p="3"
        justify="between"
        align="center"
        onClick={() => console.log("there")}
        style={{ zIndex: 10 }}
      >
        <Flex gap={"4"} direction={"row"}>
          <Link href="https://saket-choudhary.me/pysradb/index.html">Docs</Link>
          <Link href="#">Paper</Link>
        </Flex>
        <Flex gap={"4"} align={"center"}>
          <Link href="https://saketlab.in/">Saket Lab</Link>
          <Button
            onClick={() => redirect("https://github.com/saketkc/pysradb")}
          >
            <GitHubLogoIcon /> Star on GitHub
          </Button>
        </Flex>
      </Flex>
      <HomeSearchBar />
      {/* <Footer /> */}
    </Flex>
  );
}
