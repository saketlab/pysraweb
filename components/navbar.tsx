import { Box, Flex, Link } from "@radix-ui/themes";
import GitHubButton from "./github-button";
import ThemeToggle from "./theme-toggle";

export default function Navabar() {
  return (
    <Flex justify="between" align="center" p="3">
      <Flex gap={"4"} align={"center"}>
        <Link
          target="_blank"
          href="https://saket-choudhary.me/pysradb/index.html"
        >
          CLI
        </Link>
        {/* <Link href="#">Paper</Link> */}
        <Link target="_blank" href="https://saketlab.in/">
          Saket Lab
        </Link>
        <Link target="_blank" href="mailto:saketc@iitb.ac.in">
          Contact
        </Link>
      </Flex>
      <Flex
        display={{ initial: "none", sm: "flex" }}
        gap={"4"}
        align={"center"}
      >
        <ThemeToggle />
        <GitHubButton />
      </Flex>
      <Box display={{ initial: "block", sm: "none" }}>
        <ThemeToggle />
      </Box>
    </Flex>
  );
}
