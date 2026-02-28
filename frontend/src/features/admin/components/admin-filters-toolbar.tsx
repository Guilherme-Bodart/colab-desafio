"use client";

import Link from "next/link";
import {
  categoryOptions,
  priorityOptions,
  statusOptions,
} from "@/src/features/admin-list/constants/request-filters";
import type { RequestStatus } from "@/src/types/request";

type AdminFiltersToolbarProps = {
  title: string;
  subtitle: string;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  statusFilter: RequestStatus | "";
  onStatusFilterChange: (value: RequestStatus | "") => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  navHref: string;
  navLabel: string;
  navIcon: "list" | "map";
};

function ListIcon() {
  return (
    <svg
      className="admin-nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 6.5h16M4 12h16M4 17.5h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg
      className="admin-nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 6.2L8.8 4L15.2 6.2L21 4V17.8L15.2 20L8.8 17.8L3 20V6.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8.8 4V17.8M15.2 6.2V20" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function AdminFiltersToolbar({
  title,
  subtitle,
  searchInput,
  onSearchInputChange,
  categoryFilter,
  onCategoryFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  statusFilter,
  onStatusFilterChange,
  hasActiveFilters,
  onClearFilters,
  navHref,
  navLabel,
  navIcon,
}: AdminFiltersToolbarProps) {
  return (
    <section className="admin-toolbar">
      <div className="admin-toolbar-rows">
        <div className="admin-toolbar-row">
          <div className="admin-toolbar-heading">
            <div>
              <h2>{title}</h2>
              <p className="admin-toolbar-sub">{subtitle}</p>
            </div>
          </div>
          <div className="admin-toolbar-right">
            <input
              className="admin-toolbar-search"
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              placeholder={"Buscar por endereço"}
            />
            <Link
              href={navHref}
              className={`admin-nav-btn ${navIcon === "map" ? "admin-nav-btn-map" : ""}`.trim()}
            >
              {navIcon === "map" ? <MapIcon /> : <ListIcon />}
              {navLabel}
            </Link>
          </div>
        </div>

        <div className="admin-toolbar-row">
          <span className="admin-filter-label">Filtrar por:</span>
          <div className="admin-toolbar-filter-group">
            <select value={categoryFilter} onChange={(e) => onCategoryFilterChange(e.target.value)}>
              <option value="">Categoria: Todas</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select value={priorityFilter} onChange={(e) => onPriorityFilterChange(e.target.value)}>
              <option value="">Prioridade: Todas</option>
              {priorityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as RequestStatus | "")}
            >
              <option value="">Status: Todos</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            {hasActiveFilters ? (
              <button type="button" className="admin-clear-link" onClick={onClearFilters}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                Limpar filtros
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
