import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          padding: "60px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "800px",
            height: "800px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 32,
            zIndex: 1,
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div
              style={{
                fontSize: 96,
                fontWeight: 900,
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
                backgroundClip: "text",
                color: "transparent",
                display: "flex",
                letterSpacing: "-0.03em",
              }}
            >
              pysraweb
            </div>
          </div>

          <div
            style={{
              fontSize: 36,
              fontWeight: 600,
              color: "#e2e8f0",
              maxWidth: "900px",
              lineHeight: 1.3,
              display: "flex",
            }}
          >
            Fast exploration of GEO and SRA sequencing datasets
          </div>

          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: 24,
                fontWeight: 700,
                backgroundColor: "#0ea5e9",
                color: "#ffffff",
              }}
            >
              GEO
            </div>
            <div
              style={{
                display: "flex",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: 24,
                fontWeight: 700,
                backgroundColor: "#8b5cf6",
                color: "#ffffff",
              }}
            >
              SRA
            </div>
            <div
              style={{
                display: "flex",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: 24,
                fontWeight: 700,
                backgroundColor: "#10b981",
                color: "#ffffff",
              }}
            >
              ENA
            </div>
            <div
              style={{
                display: "flex",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: 24,
                fontWeight: 700,
                backgroundColor: "#f59e0b",
                color: "#ffffff",
              }}
            >
              ArrayExpress
            </div>
          </div>

          <div
            style={{
              fontSize: 24,
              fontWeight: 500,
              color: "#94a3b8",
              marginTop: 24,
              display: "flex",
            }}
          >
            pysraweb.saketlab.org • Saket Lab, IIT Bombay
          </div>
        </div>
      </div>
    ),
    size,
  );
}
