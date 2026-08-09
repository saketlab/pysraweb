"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { Box, Card, Flex, IconButton, Text } from "@radix-ui/themes";
import Image from "next/image";
import { useRef } from "react";

type SetupStep = {
  image: string;
  description: string;
};

export default function ClaudeSetupCarousel({
  steps,
}: {
  steps: readonly SetupStep[];
}) {
  const carouselRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "previous" | "next") {
    const carousel = carouselRef.current;
    if (!carousel) return;

    carousel.scrollBy({
      left: direction === "next" ? carousel.clientWidth : -carousel.clientWidth,
      behavior: "smooth",
    });
  }

  return (
    <Box>
      <Flex justify="end" gap="2" mb="2">
        <IconButton
          variant="soft"
          color="gray"
          aria-label="Show previous setup step"
          onClick={() => scroll("previous")}
        >
          <ChevronLeftIcon />
        </IconButton>
        <IconButton
          variant="soft"
          color="gray"
          aria-label="Show next setup step"
          onClick={() => scroll("next")}
        >
          <ChevronRightIcon />
        </IconButton>
      </Flex>
      <Box
        ref={carouselRef}
        aria-label="Claude setup walkthrough"
        style={{
          display: "flex",
          gap: "1rem",
          overflowX: "auto",
          paddingBottom: "0.75rem",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {steps.map((step, index) => (
          <Card
            key={step.image}
            style={{
              flex: "0 0 min(82vw, 42rem)",
              overflow: "hidden",
              scrollSnapAlign: "start",
            }}
          >
            <Image
              src={step.image}
              alt={`Step ${index + 1}: ${step.description}`}
              width={1293}
              height={856}
              sizes="(max-width: 768px) 82vw, 42rem"
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                borderRadius: "var(--radius-2)",
              }}
            />
            <Text as="p" size={{ initial: "1", md: "2" }} mt="2">
              <Text weight="bold">Step {index + 1}.</Text> {step.description}
            </Text>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
