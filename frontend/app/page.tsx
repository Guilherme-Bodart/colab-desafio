"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import { ReportForm } from "@/src/features/report/components/report-form";
import { env } from "@/src/lib/env";

export default function Home() {
  if (!env.googleMapsApiKey) {
    return (
      <main className="container">
        <section className="card">
          <h1>Zeladoria Inteligente</h1>
          <p className="error">
            Defina NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no frontend/.env.local
          </p>
        </section>
      </main>
    );
  }

  return (
    <APIProvider apiKey={env.googleMapsApiKey} libraries={["places"]}>
      <main className="container">
        <section className="card">
          <h1>Zeladoria Inteligente</h1>
          <p className="subtitle">Relate um problema urbano para triagem.</p>
          <ReportForm />
        </section>
      </main>
    </APIProvider>
  );
}
