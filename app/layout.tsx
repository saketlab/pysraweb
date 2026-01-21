import Wrapper from "@/components/wrapper";
import "@radix-ui/themes/styles.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "pysraweb",
  description:
    "Discover GEO & SRA datasets. Developed at Saket Lab, IIT Bombay.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en">
      <body>
        <Wrapper>{children}</Wrapper>
      </body>
    </html>
  );
}
