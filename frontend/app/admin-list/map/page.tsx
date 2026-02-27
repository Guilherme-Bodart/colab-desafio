"use client";

import { AdminRequestMap } from "@/src/features/admin-list-map/components/admin-request-map";

export default function AdminListMapPage() {
  return (
    <main className="container admin-page">
      <section className="card admin-card">
        <AdminRequestMap />
      </section>
    </main>
  );
}
