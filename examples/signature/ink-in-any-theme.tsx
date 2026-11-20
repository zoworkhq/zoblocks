import type { CSSProperties } from "react";
import { ConfigProvider, theme } from "antd";
import { SignatureInk } from "@zoblocks/signature";
import { Example, patientSignature } from "./_shared/shared";

const lightStyle = {
  "--zb-text": "#1f1f1f",
  color: "var(--zb-text)",
  padding: 16,
  background: "#fff",
  border: "1px solid #ddd",
} as CSSProperties;
const darkStyle = {
  "--zb-text": "#f5f5f5",
  color: "var(--zb-text)",
  padding: 16,
  background: "#141414",
  border: "1px solid #444",
} as CSSProperties;

export default function StoredInkAnyTheme() {
  return (
    <Example>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
          <div style={lightStyle}>
            <p>Light</p>
            <SignatureInk ink={patientSignature.ink} label="Josh Randall's signature" height={56} />
          </div>
        </ConfigProvider>
        <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
          <div style={darkStyle}>
            <p>Dark</p>
            <SignatureInk ink={patientSignature.ink} label="Josh Randall's signature" height={56} />
          </div>
        </ConfigProvider>
      </div>
    </Example>
  );
}
