import React from "react";
import { C } from "../styles/theme";

export default function HeroSection({ landing }) {
  return (
    <div
      style={{
        background: C.dark,
        padding: "48px 24px 40px",
        position: "relative",
      }}
    >
      {/* Cerchio decorativo sfondo */}
      <div
        style={{
          position: "absolute",
          right: -60,
          top: -60,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: `${C.primary}22`,
          pointerEvents: "none",
        }}
      />

      <p
        style={{
          margin: "0 0 8px",
          fontSize: 11,
          color: "#ffffff70",
          letterSpacing: ".08em",
          textTransform: "uppercase",
        }}
      >
        {landing.location || "A.S.D. · Lecce, Puglia"}
      </p>
      <h1
        style={{
          margin: "0 0 8px",
          fontSize: "clamp(22px, 5vw, 32px)",
          fontWeight: 700,
          color: "#fff",
          lineHeight: 1.25,
          maxWidth: 480,
        }}
      >
        {landing.title || "Tour in moto nel Salento e oltre"}
      </h1>
      <p
        style={{
          margin: "0 0 24px",
          fontSize: 15,
          color: "#ffffff99",
          maxWidth: 440,
        }}
      >
        {landing.subtitle || "Per amicizia e solidarietà"}
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <a
          href="#chi-siamo"
          style={{
            padding: "10px 20px",
            background: C.primary,
            color: "#fff",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Scopri di più
        </a>
        <a
          href="#come-funziona"
          style={{
            padding: "10px 20px",
            border: "1.5px solid rgba(255,255,255,.3)",
            color: "#fff",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Come partecipare
        </a>
      </div>
    </div>
  );
}
