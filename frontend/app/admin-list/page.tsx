"use client";

import { AdminRequestList } from "@/src/features/admin-list/components/admin-request-list";

export default function AdminListPage() {
  return (
    <main className="container admin-page">
      <section className="card admin-card">
        <AdminRequestList />
      </section>
    </main>
  );
}
