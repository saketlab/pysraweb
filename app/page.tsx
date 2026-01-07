import HomeSearchBar from "@/components/home-search-bar";
import Navabar from "@/components/navbar";
import { Flex } from "@radix-ui/themes";

export default function Home() {
  return (
    <Flex style={{ height: "100dvh" }} direction="column">
      <Navabar />
      <main>
        <HomeSearchBar />
      </main>
    </Flex>
  );
}
