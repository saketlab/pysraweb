"use client";
import dynamic from "next/dynamic";

const SampleDetailPage = dynamic(
  () => import("@/components/sample-detail-page"),
  { ssr: false },
);

export default function SamplePage() {
  return <SampleDetailPage />;
}
