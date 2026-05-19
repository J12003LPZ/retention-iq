export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0b1326",
        color: "#dae2fd",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        textAlign: "center",
        padding: 24,
      }}
    >
      <div>
        <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-0.02em" }}>404</div>
        <p style={{ marginTop: 8, color: "#c7c4d7" }}>This page doesn&apos;t exist.</p>
      </div>
    </div>
  );
}
