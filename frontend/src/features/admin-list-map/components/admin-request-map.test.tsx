import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminRequestMap } from "./admin-request-map";
import { listAllRequests } from "../services/list-all-requests";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/src/lib/env", () => ({
  env: {
    apiBaseUrl: "http://localhost:3333",
    googleMapsApiKey: "",
  },
}));

vi.mock("../services/list-all-requests", () => ({
  listAllRequests: vi.fn(),
}));

const mockedListAllRequests = vi.mocked(listAllRequests);

describe("AdminRequestMap", () => {
  beforeEach(() => {
    mockedListAllRequests.mockReset();
    mockedListAllRequests.mockResolvedValue({
      data: [],
      total: 0,
    });
  });

  it("renderiza toolbar em duas linhas e limpa filtros voltando status para Pendente", async () => {
    const user = userEvent.setup();
    render(<AdminRequestMap />);

    await waitFor(() => {
      expect(mockedListAllRequests).toHaveBeenCalledWith(
        expect.objectContaining({ status: "Pendente" })
      );
    });

    expect(screen.getByText("Filtrar por:")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Buscar por endereço")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver lista/i })).toBeInTheDocument();

    const statusSelect = screen
      .getAllByRole("combobox")
      .find((select) => (select as HTMLSelectElement).value === "Pendente") as
      | HTMLSelectElement
      | undefined;

    expect(statusSelect).toBeDefined();

    await user.selectOptions(statusSelect!, "");
    expect(await screen.findByRole("button", { name: /limpar filtros/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /limpar filtros/i }));

    await waitFor(() => {
      expect(statusSelect!.value).toBe("Pendente");
    });
  });
});
