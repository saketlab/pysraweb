import { GitHubLogoIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Button, Flex, Link, Text, TextField } from "@radix-ui/themes";
import Image from "next/image";

export default function Home() {
  return (
    <Flex style={{ height: "100svh" }} direction="column">
      {/* Header */}
      <Flex justify="between" align="center" p="3">
        <Link>Docs</Link>
        <Button>
          <GitHubLogoIcon /> Star on GitHub
        </Button>
      </Flex>

      {/* Center Content */}
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

        <TextField.Root
          placeholder="all scRNA-seq datasets from 2024 to 2023 which use 10x technology"
          size="3"
          style={{ width: "60%" }}
        >
          <TextField.Slot>
            <MagnifyingGlassIcon height="16" width="16" />
          </TextField.Slot>
        </TextField.Root>
      </Flex>

      {/* Footer */}
      <footer>
        <Flex justify="center" p="2">
          <Text color="gray">Saket Lab, 2025</Text>
        </Flex>
      </footer>
    </Flex>
  );
}
