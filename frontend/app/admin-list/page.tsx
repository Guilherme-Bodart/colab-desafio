"use client";

import { AdminRequestList } from "@/src/features/admin-list/components/admin-request-list";

export default function AdminListPage() {
  return (
    <main className="container admin-page">
      <section className="card admin-card">
        <h1>Painel Administrativo</h1>
        <p className="subtitle">
          Lista completa de solicitações com atualização de status.
        </p>
        <AdminRequestList />
      </section>
    </main>
  );
}
