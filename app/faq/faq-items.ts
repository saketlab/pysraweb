import { LAST_INDEX_REFRESH } from "@/utils/constants";

export const updateFrequencyAnswer = (date: string) =>
  `We refresh the metadata index on a regular schedule to stay in sync with NCBI and EBI. The last full refresh was on ${date}. New datasets appear within a few days of their public release.`;

export const faqItems = [
  {
    id: "data-sources",
    question: "Where does seqout fetch its datasets from?",
    answer:
      "We maintain a local mirror of all publicly available datasets on NCBI's FTP servers. This includes all SRA datasets and GEO datasets. We also index ArrayExpress and ENA metadata from EBI, GSA (CNCB-NGDC Genome Sequence Archive) metadata from CNCB-NGDC in China, and DDBJ metadata from Japan, both its Sequence Read Archive (DRA) and its Genomic Expression Archive (GEA). We do not own or modify the original data.",
  },
  {
    id: "download-data",
    question: "Does seqout download sequencing data?",
    answer:
      "No. seqout only indexes and serves metadata. It does not download or host raw sequencing files such as FASTQ or BAM. Project pages do provide bash scripts for downloading FASTQ/SRA files from NCBI, AWS S3, and Google Cloud Storage.",
  },
  {
    id: "difference",
    question: "How is seqout different from browsing NCBI directly?",
    answer:
      "seqout combines GEO, SRA, ENA, DRA, GEA, GSA & ArrayExpress metadata into one interface with relevance-ranked search and consolidated tabular views. NCBI spreads this across multiple pages. seqout also adds enriched metadata, similarity graphs, citation counts, and download scripts.",
  },
  {
    id: "scale",
    question: "Is seqout suitable for large-scale searches?",
    answer:
      "Yes. The backend handles low-latency queries over millions of records. You can filter and compare across studies without waiting.",
  },
  {
    id: "audience",
    question: "Who is seqout intended for?",
    answer:
      "We built seqout for researchers who explore public sequencing metadata and want faster, more structured ways to find datasets.",
  },
  {
    id: "update-frequency",
    question: "How often is seqout updated?",
    answer: updateFrequencyAnswer(LAST_INDEX_REFRESH),
  },
  {
    id: "api",
    question: "Can I use seqout programmatically?",
    answer:
      "Yes. seqout offers a free REST API with no authentication required. All endpoints return JSON and support cursor-based pagination. Rate limits are 60 requests/minute for most endpoints, 30/minute for search, and 10/minute for bulk operations. See the API Reference for full documentation.",
  },
  {
    id: "enriched-metadata",
    question: "What is enriched metadata?",
    answer:
      "For many projects, we run small language models (SLMs) over free-text sample descriptions to extract structured fields like tissue, cell type, disease, sex, and age. The extractions may contain errors, so treat them as a starting point rather than ground truth. Enriched columns appear in the sample table with a purple AI badge.",
  },
  {
    id: "mcp",
    question: "What is the MCP server?",
    answer:
      "seqout exposes a remote Model Context Protocol (MCP) server. LLM clients like Claude Desktop can connect to it and search datasets through chat. The URL is https://seqout.org/api/mcp. See the MCP page for setup instructions.",
  },
  {
    id: "similarity",
    question: "How does the similarity graph work?",
    answer:
      "We embed each project into a vector space based on its metadata and precompute nearest-neighbor relationships. The similarity graph renders these as an interactive 3D force-directed layout. You can filter by organism and click through clusters of related studies.",
  },
  {
    id: "accession-map",
    question: "What is the 2D accession map?",
    answer:
      "The Map page shows a 2D embedding of roughly 1 million datasets, where proximity reflects metadata similarity. You can zoom, pan, filter by country, and click individual points to navigate to project pages. The browser loads data in a binary format for fast rendering.",
  },
  {
    id: "cite",
    question: "How do I cite seqout?",
    answer: "Aniruddha Mukherjee and Saket Choudhary. seqout.org.",
  },
  {
    id: "open-source",
    question: "Is seqout open source?",
    answer:
      "Yes. The frontend source code lives on GitHub at github.com/saketlab/seqout.",
  },
  {
    id: "browsers",
    question: "What browsers are supported?",
    answer:
      "Chrome, Firefox, Safari, and Edge all work. The 3D similarity graph and deck.gl maps require WebGL.",
  },
];
