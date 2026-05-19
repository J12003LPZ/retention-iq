"use client";

export const dynamic = "force-dynamic";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          background: "#0b1326",
          color: "#dae2fd",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 24, fontWeight: 600 }}>Something went wrong.</h2>
          <p style={{ marginTop: 8, color: "#c7c4d7" }}>{error.message}</p>
          <button
            onClick={() => unstable_retry()}
            style={{
              marginTop: 16,
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #464554",
              background: "transparent",
              color: "#dae2fd",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
