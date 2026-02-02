import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "pysraweb - Search GEO & SRA Datasets",
    short_name: "pysraweb",
    description:
      "Fast exploration of GEO and SRA sequencing datasets with unified metadata views.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e1015",
    theme_color: "#0e1015",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
