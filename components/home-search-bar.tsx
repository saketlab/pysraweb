"use client";
import {
  DoubleArrowDownIcon,
  DoubleArrowUpIcon,
  MagicWandIcon,
  MagnifyingGlassIcon,
  MixerHorizontalIcon,
} from "@radix-ui/react-icons";
import {
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Select,
  TextField,
} from "@radix-ui/themes";
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
  const [searchMethod, setSearchMethod] = useState(searchType.NLPSearch);
  const [hideFilters, setHideFilters] = useState(true);

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
      <Box width={"10rem"}>
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
      <Box width={{ initial: "85%", md: "60%" }}>
        <Flex direction={"column"} gap={"4"}>
          {searchMethod == searchType.NLPSearch && (
            <form onSubmit={handleSubmit}>
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
          )}
          {searchMethod == searchType.FilterSearch && (
            <Card variant="surface">
              <form>
                <Grid columns={"2"} gap={"2"}>
                  <label>Scientific name</label>
                  <TextField.Root placeholder="homo sapiens" />
                  <label>Strain</label>
                  <TextField.Root placeholder="homo sapiens" />
                  <label>Phenotype</label>
                  <TextField.Root placeholder="homo sapiens" />
                  <label>Tissue/organ</label>
                  <TextField.Root placeholder="blood" />
                  <label>Cell type</label>
                  <TextField.Root placeholder="CD8+" />
                  <label>Disease</label>
                  <TextField.Root placeholder="Diabetes" />

                  {!hideFilters && (
                    <>
                      <label>Disease Stage</label>
                      <TextField.Root placeholder="Diabetes" />

                      <label>Treatment</label>
                      <TextField.Root placeholder="Diabetes" />

                      <label>Technology</label>
                      <TextField.Root placeholder="Illumina" />

                      <label>Ethnicity</label>
                      <TextField.Root placeholder="Asian" />

                      <label>Sex</label>
                      <Select.Root defaultValue="both">
                        <Select.Trigger />
                        <Select.Content>
                          <Select.Group>
                            <Select.Label>Select sex</Select.Label>
                            <Select.Item value="male">Male</Select.Item>
                            <Select.Item value="female">Female</Select.Item>
                            <Select.Item value="both">
                              Male & Female
                            </Select.Item>
                          </Select.Group>
                        </Select.Content>
                      </Select.Root>

                      <label>Oldest publication date</label>
                      <TextField.Root type="date" />
                    </>
                  )}
                </Grid>
              </form>
            </Card>
          )}
          {searchMethod == searchType.FilterSearch && (
            <Button
              onClick={() => setHideFilters(!hideFilters)}
              style={{ width: "max-content", margin: "auto" }}
              variant="soft"
            >
              {hideFilters ? (
                <>
                  {" "}
                  <DoubleArrowDownIcon /> Show more filters
                </>
              ) : (
                <>
                  {" "}
                  <DoubleArrowUpIcon /> Hide filters
                </>
              )}
            </Button>
          )}
          <Button
            onClick={() =>
              setSearchMethod(
                searchMethod == searchType.NLPSearch
                  ? searchType.FilterSearch
                  : searchType.NLPSearch
              )
            }
            style={{ width: "max-content", margin: "auto" }}
            variant="ghost"
          >
            {searchMethod == searchType.NLPSearch ? (
              <>
                {" "}
                <MixerHorizontalIcon /> Search with filters
              </>
            ) : (
              <>
                {" "}
                <MagicWandIcon /> Search in natural language
              </>
            )}
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
}
