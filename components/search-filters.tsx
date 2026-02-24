"use client";

import { OrganismFilter, OrganismNameMode } from "@/components/organism_filter";
import type { SortBy } from "@/components/search-page-body";
import { SearchResult } from "@/utils/types";
import { Cross2Icon } from "@radix-ui/react-icons";
import {
  Badge,
  Flex,
  RadioGroup,
  Select,
  Separator,
  Text,
  TextField,
  Tooltip,
} from "@radix-ui/themes";
import { useState } from "react";

type TimeFilter = "any" | "1" | "5" | "10" | "20" | "custom";

type SearchFiltersProps = {
  db: string | null;
  query: string | null;
  setSortBy: (value: SortBy) => void;
  setTimeFilter: (value: TimeFilter) => void;
  timeFilter: TimeFilter;
  customYearRange: { from: string; to: string };
  setCustomYearRange: (value: { from: string; to: string }) => void;
  onDatabaseChange: (value: "geo" | "sra" | "arrayexpress" | "both") => void;
};

function AppliedCountBadge({
  count,
  label,
  onClear,
}: {
  count: number;
  label: string;
  onClear: () => void;
}) {
  return (
    <Badge>
      <Flex align="center" gap="1">
        <span>{count}</span>
        <Tooltip content="Clear filters">
          <button
            type="button"
            aria-label={`Clear ${label} filters`}
            onClick={(event) => {
              event.stopPropagation();
              onClear();
            }}
            style={{
              border: "none",
              background: "transparent",
              color: "inherit",
              padding: 0,
              margin: 0,
              display: "inline-flex",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <Cross2Icon />
          </button>
        </Tooltip>
      </Flex>
    </Badge>
  );
}

export function SearchFilters({
  db,
  query,
  setSortBy,
  setTimeFilter,
  timeFilter,
  customYearRange,
  setCustomYearRange,
  onDatabaseChange,
}: SearchFiltersProps) {
  return (
    <>
      <Flex
        direction={"row-reverse"}
        justify={"center"}
        gap={"2"}
        wrap="wrap"
        display={{ initial: "flex", md: "none" }}
      >
        <Select.Root
          defaultValue="relevance"
          name="sort"
          onValueChange={(value) => setSortBy(value as SortBy)}
          size={"1"}
        >
          <Select.Trigger />
          <Select.Content>
            <Select.Group>
              <Select.Item value="relevance">Sort by relevance</Select.Item>
              <Select.Item value="date">Sort by date</Select.Item>
              <Select.Item value="citations">Sort by citations</Select.Item>
              <Select.Item value="journal">Sort by journal</Select.Item>
            </Select.Group>
          </Select.Content>
        </Select.Root>

        <Select.Root
          defaultValue="any"
          name="time"
          onValueChange={(value) =>
            setTimeFilter(value as "any" | "1" | "5" | "10" | "20")
          }
          size={"1"}
        >
          <Select.Trigger />
          <Select.Content>
            <Select.Group>
              <Select.Item value="any">Any time</Select.Item>
              <Select.Item value="1">Last year</Select.Item>
              <Select.Item value="5">Last 5 yrs</Select.Item>
              <Select.Item value="10">Last 10 yrs</Select.Item>
              <Select.Item value="20">Last 20 yrs</Select.Item>
            </Select.Group>
          </Select.Content>
        </Select.Root>

        <Select.Root
          defaultValue={db ? db : "both"}
          onValueChange={(value) => {
            if (!query) return;
            onDatabaseChange(value as "geo" | "sra" | "arrayexpress" | "both");
          }}
          size={"1"}
        >
          <Select.Trigger />
          <Select.Content>
            <Select.Group>
              <Select.Item value="geo">Only GEO</Select.Item>
              <Select.Item value="sra">Only SRA</Select.Item>
              <Select.Item value="arrayexpress">Only ArrayExpress</Select.Item>
              <Select.Item value="both">From all sources</Select.Item>
            </Select.Group>
          </Select.Content>
        </Select.Root>
      </Flex>

      <Flex
        direction={"column"}
        gap={"4"}
        display={{ initial: "none", md: "flex" }}
        position={"sticky"}
        style={{ top: "9rem" }}
        height={"fit-content"}
      >
        <RadioGroup.Root
          defaultValue={db ? db : "both"}
          name="dataset"
          onValueChange={(value) => {
            if (!query) return;
            onDatabaseChange(value as "geo" | "sra" | "arrayexpress" | "both");
          }}
        >
          <RadioGroup.Item value="geo">Only GEO</RadioGroup.Item>
          <RadioGroup.Item value="sra">Only SRA</RadioGroup.Item>
          <RadioGroup.Item value="arrayexpress">
            Only ArrayExpress
          </RadioGroup.Item>
          <RadioGroup.Item value="both">From all sources</RadioGroup.Item>
        </RadioGroup.Root>

        <Separator orientation={"horizontal"} size={"4"} />

        <RadioGroup.Root
          defaultValue="relevance"
          name="sort"
          onValueChange={(value) => setSortBy(value as SortBy)}
        >
          <RadioGroup.Item value="relevance">Sort by relevance</RadioGroup.Item>
          <RadioGroup.Item value="date">Sort by date</RadioGroup.Item>
          <RadioGroup.Item value="citations">Sort by citations</RadioGroup.Item>
          <RadioGroup.Item value="journal">Sort by journal</RadioGroup.Item>
        </RadioGroup.Root>

        <Separator orientation={"horizontal"} size={"4"} />

        <RadioGroup.Root
          defaultValue="any"
          name="time"
          onValueChange={(value) =>
            setTimeFilter(value as "any" | "1" | "5" | "10" | "20" | "custom")
          }
        >
          <RadioGroup.Item value="any">Any time</RadioGroup.Item>
          <RadioGroup.Item value="1">Since last year</RadioGroup.Item>
          <RadioGroup.Item value="5">Since last 5 years</RadioGroup.Item>
          <RadioGroup.Item value="10">Since last 10 years</RadioGroup.Item>
          <RadioGroup.Item value="20">Since last 20 years</RadioGroup.Item>
          <RadioGroup.Item value="custom">Custom range</RadioGroup.Item>
        </RadioGroup.Root>
        {timeFilter === "custom" && (
          <Flex gap="2" align="center">
            <TextField.Root
              type="number"
              min="2000"
              max={new Date().getFullYear()}
              value={customYearRange.from}
              onChange={(e) =>
                setCustomYearRange({ ...customYearRange, from: e.target.value })
              }
              placeholder="YYYY"
              variant="surface"
              size={"2"}
              style={{ width: "3.5rem" }}
            />
            <Text size="2">to</Text>
            <TextField.Root
              type="number"
              min="2000"
              max={new Date().getFullYear()}
              value={customYearRange.to}
              onChange={(e) =>
                setCustomYearRange({ ...customYearRange, to: e.target.value })
              }
              placeholder="YYYY"
              variant="surface"
              style={{ width: "3.5rem" }}
              size={"2"}
            />
          </Flex>
        )}
      </Flex>
    </>
  );
}

export function SearchOrganismRail({
  results,
  organismNameMode,
  setOrganismNameMode,
  selectedOrganismKey,
  setSelectedOrganismFilter,
}: {
  results: SearchResult[];
  organismNameMode: OrganismNameMode;
  setOrganismNameMode: (value: OrganismNameMode) => void;
  selectedOrganismKey: string | null;
  setSelectedOrganismFilter: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    assay: true,
    platform: false,
    country: true,
    organization: false,
  });
  const [selectedAssays, setSelectedAssays] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>(
    [],
  );

  const assayOptions = ["RNA-Seq", "ChIP-Seq", "ATAC-Seq", "WGS"];
  const platformOptions = [
    "Illumina NovaSeq 6000",
    "Illumina HiSeq 2500",
    "Oxford Nanopore",
    "PacBio Sequel II",
  ];
  const countryOptions = [
    "United States",
    "United Kingdom",
    "Germany",
    "Japan",
  ];
  const organizationOptions = [
    "Broad Institute",
    "NCBI",
    "EMBL-EBI",
    "Stanford University",
  ];

  const toggleSelection = (
    values: string[],
    setValues: (next: string[]) => void,
    value: string,
  ) => {
    if (values.includes(value)) {
      setValues(values.filter((item) => item !== value));
      return;
    }
    setValues([...values, value]);
  };

  return (
    <Flex
      display={{ initial: "none", md: "flex" }}
      direction="column"
      gap="2"
      width={{ md: "220px", lg: "280px" }}
      position="sticky"
      style={{ top: "7rem", height: "fit-content" }}
    >
      <OrganismFilter
        results={results}
        mode={organismNameMode}
        onChangeMode={setOrganismNameMode}
        selectedKey={selectedOrganismKey}
        onChangeSelection={setSelectedOrganismFilter}
      />
      {/* <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger>
          <Button variant="surface">
            <MixerHorizontalIcon />
            More filters
          </Button>
        </Dialog.Trigger>
        <Dialog.Content size="3">
          <Dialog.Title>More filters</Dialog.Title>

          <Flex direction="column" gap="2">
            <Card variant="surface">
              <Flex direction="column" gap="2">
                <Flex align="center" justify="between" px="2">
                  <Flex align="center" gap="2">
                    <Text size="3" style={{ fontSize: 14, lineHeight: "20px" }}>
                      Assay
                    </Text>
                    {!expandedSections.assay && selectedAssays.length > 0 ? (
                      <AppliedCountBadge
                        count={selectedAssays.length}
                        label="assay"
                        onClear={() => setSelectedAssays([])}
                      />
                    ) : null}
                  </Flex>
                  <IconButton
                    variant="ghost"
                    color="gray"
                    aria-label={
                      expandedSections.assay
                        ? "Collapse assay filters"
                        : "Expand assay filters"
                    }
                    onClick={() =>
                      setExpandedSections((prev) => ({
                        ...prev,
                        assay: !prev.assay,
                      }))
                    }
                  >
                    {expandedSections.assay ? (
                      <ChevronUpIcon />
                    ) : (
                      <ChevronDownIcon />
                    )}
                  </IconButton>
                </Flex>
                {expandedSections.assay ? (
                  <Flex direction="column" gap="2" pl="1">
                    {assayOptions.map((assay) => (
                      <Text as="label" size="2" key={assay}>
                        <Flex align="center" gap="2">
                          <Checkbox
                            checked={selectedAssays.includes(assay)}
                            onCheckedChange={() =>
                              toggleSelection(
                                selectedAssays,
                                setSelectedAssays,
                                assay,
                              )
                            }
                          />
                          {assay}
                        </Flex>
                      </Text>
                    ))}
                  </Flex>
                ) : null}
              </Flex>
            </Card>

            <Card variant="surface">
              <Flex direction="column" gap="2">
                <Flex align="center" justify="between" px="2">
                  <Flex align="center" gap="2">
                    <Text size="3" style={{ fontSize: 14, lineHeight: "20px" }}>
                      Platform
                    </Text>
                    {!expandedSections.platform && selectedPlatforms.length > 0 ? (
                      <AppliedCountBadge
                        count={selectedPlatforms.length}
                        label="platform"
                        onClear={() => setSelectedPlatforms([])}
                      />
                    ) : null}
                  </Flex>
                  <IconButton
                    variant="ghost"
                    color="gray"
                    aria-label={
                      expandedSections.platform
                        ? "Collapse platform filters"
                        : "Expand platform filters"
                    }
                    onClick={() =>
                      setExpandedSections((prev) => ({
                        ...prev,
                        platform: !prev.platform,
                      }))
                    }
                  >
                    {expandedSections.platform ? (
                      <ChevronUpIcon />
                    ) : (
                      <ChevronDownIcon />
                    )}
                  </IconButton>
                </Flex>
                {expandedSections.platform ? (
                  <Flex direction="column" gap="2" pl="1">
                    {platformOptions.map((platform) => (
                      <Text as="label" size="2" key={platform}>
                        <Flex align="center" gap="2">
                          <Checkbox
                            checked={selectedPlatforms.includes(platform)}
                            onCheckedChange={() =>
                              toggleSelection(
                                selectedPlatforms,
                                setSelectedPlatforms,
                                platform,
                              )
                            }
                          />
                          {platform}
                        </Flex>
                      </Text>
                    ))}
                  </Flex>
                ) : null}
              </Flex>
            </Card>

            <Card variant="surface">
              <Flex direction="column" gap="2">
                <Flex align="center" justify="between" px="2">
                  <Flex align="center" gap="2">
                    <Text size="3" style={{ fontSize: 14, lineHeight: "20px" }}>
                      Country
                    </Text>
                    {!expandedSections.country && selectedCountries.length > 0 ? (
                      <AppliedCountBadge
                        count={selectedCountries.length}
                        label="country"
                        onClear={() => setSelectedCountries([])}
                      />
                    ) : null}
                  </Flex>
                  <IconButton
                    variant="ghost"
                    color="gray"
                    aria-label={
                      expandedSections.country
                        ? "Collapse country filters"
                        : "Expand country filters"
                    }
                    onClick={() =>
                      setExpandedSections((prev) => ({
                        ...prev,
                        country: !prev.country,
                      }))
                    }
                  >
                    {expandedSections.country ? (
                      <ChevronUpIcon />
                    ) : (
                      <ChevronDownIcon />
                    )}
                  </IconButton>
                </Flex>
                {expandedSections.country ? (
                  <Flex direction="column" gap="2" pl="1">
                    {countryOptions.map((country) => (
                      <Text as="label" size="2" key={country}>
                        <Flex align="center" gap="2">
                          <Checkbox
                            checked={selectedCountries.includes(country)}
                            onCheckedChange={() =>
                              toggleSelection(
                                selectedCountries,
                                setSelectedCountries,
                                country,
                              )
                            }
                          />
                          {country}
                        </Flex>
                      </Text>
                    ))}
                  </Flex>
                ) : null}
              </Flex>
            </Card>

            <Card variant="surface">
              <Flex direction="column" gap="2">
                <Flex align="center" justify="between" px="2">
                  <Flex align="center" gap="2">
                    <Text size="3" style={{ fontSize: 14, lineHeight: "20px" }}>
                      Organization
                    </Text>
                    {!expandedSections.organization &&
                    selectedOrganizations.length > 0 ? (
                      <AppliedCountBadge
                        count={selectedOrganizations.length}
                        label="organization"
                        onClear={() => setSelectedOrganizations([])}
                      />
                    ) : null}
                  </Flex>
                  <IconButton
                    variant="ghost"
                    color="gray"
                    aria-label={
                      expandedSections.organization
                        ? "Collapse organization filters"
                        : "Expand organization filters"
                    }
                    onClick={() =>
                      setExpandedSections((prev) => ({
                        ...prev,
                        organization: !prev.organization,
                      }))
                    }
                  >
                    {expandedSections.organization ? (
                      <ChevronUpIcon />
                    ) : (
                      <ChevronDownIcon />
                    )}
                  </IconButton>
                </Flex>
                {expandedSections.organization ? (
                  <Flex direction="column" gap="2" pl="1">
                    {organizationOptions.map((organization) => (
                      <Text as="label" size="2" key={organization}>
                        <Flex align="center" gap="2">
                          <Checkbox
                            checked={selectedOrganizations.includes(
                              organization,
                            )}
                            onCheckedChange={() =>
                              toggleSelection(
                                selectedOrganizations,
                                setSelectedOrganizations,
                                organization,
                              )
                            }
                          />
                          {organization}
                        </Flex>
                      </Text>
                    ))}
                  </Flex>
                ) : null}
              </Flex>
            </Card>
          </Flex>
        </Dialog.Content>
      </Dialog.Root> */}
    </Flex>
  );
}
