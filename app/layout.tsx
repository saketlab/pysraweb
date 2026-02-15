import Wrapper from "@/components/wrapper";
import "@radix-ui/themes/styles.css";
import type { Metadata } from "next";
import Script from "next/script";

const GA_TRACKING_ID = "G-XF18RH7984";

export const viewport = {
  themeColor: "#0e1015",
};

export const metadata: Metadata = {
  title: {
    default: "pysraweb - Search GEO and SRA Datasets",
    template: "%s | pysraweb",
  },
  description:
    "Fast exploration of GEO and SRA sequencing datasets. Search millions of experiments with unified metadata views, relevance-ranked results, and consolidated sample tables. Developed at Saket Lab, IIT Bombay.",
  keywords: [
    "SRA",
    "GEO",
    "Sequence Read Archive",
    "Gene Expression Omnibus",
    "NCBI",
    "sequencing data",
    "genomics",
    "transcriptomics",
    "RNA-seq",
    "ChIP-seq",
    "ATAC-seq",
    "bioinformatics",
    "metadata search",
    "public datasets",
  ],
  authors: [{ name: "Saket Lab", url: "https://saketlab.org" }],
  creator: "Saket Lab, IIT Bombay",
  publisher: "Saket Lab",
  metadataBase: new URL("https://pysraweb.saketlab.org"),
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://pysraweb.saketlab.org",
    siteName: "pysraweb",
    title: "pysraweb - Search GEO and SRA Datasets",
    description:
      "Fast exploration of GEO and SRA sequencing datasets. Search millions of experiments with unified metadata views and relevance-ranked results.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "pysraweb - GEO, SRA, ENA & ArrayExpress Dataset Search",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "pysraweb - Search GEO, SRA, ENA & ArrayExpress",
    description:
      "Fast exploration of sequencing datasets. Search millions of experiments with unified metadata views.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <style dangerouslySetInnerHTML={{ __html: `
          .logo-light { display: block; }
          .logo-dark { display: none; }
          .dark .logo-light { display: none; }
          .dark .logo-dark { display: block; }
        `}} />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}');
          `}
        </Script>
      </head>
      <body>
        <Wrapper>{children}</Wrapper>
      </body>
    </html>
  );
}
