import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportForm } from "./report-form";
import { createRequest } from "../services/create-request";

vi.mock("../services/create-request", () => ({
  createRequest: vi.fn(),
}));

vi.mock("./location-field", () => ({
  LocationField: ({
    value,
    onAddressChange,
    onPointChange,
    onPointReset,
  }: {
    value: string;
    onAddressChange: (address: string) => void;
    onPointChange: (point: { lat: number; lng: number }) => void;
    onPointReset: () => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() => {
          onPointChange({ lat: -23.55052, lng: -46.633308 });
          onAddressChange("Rua A");
        }}
      >
        mock-select-point
      </button>
      <button
        type="button"
        onClick={() => {
          onPointReset();
          onAddressChange("Rua B");
        }}
      >
        mock-type-address
      </button>
      <span data-testid="location-value">{value}</span>
    </div>
  ),
}));

const mockedCreateRequest = vi.mocked(createRequest);

describe("ReportForm", () => {
  beforeEach(() => {
    mockedCreateRequest.mockReset();
  });

  it("nao envia sem coordenadas", async () => {
    const user = userEvent.setup();
    render(<ReportForm />);

    await user.type(screen.getByPlaceholderText("Ex: Buraco na rua"), "Teste");
    await user.type(screen.getByPlaceholderText("Descreva o problema"), "Descricao");
    await user.click(screen.getByRole("button", { name: /enviar/i }));

    expect(mockedCreateRequest).not.toHaveBeenCalled();
    expect(screen.getByText(/incompleta/i)).toBeInTheDocument();
  });

  it("limpa coordenadas ao digitar endereco manualmente", async () => {
    const user = userEvent.setup();
    render(<ReportForm />);

    await user.click(screen.getByRole("button", { name: "mock-select-point" }));
    expect(screen.getByText(/Lat:/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "mock-type-address" }));
    expect(screen.queryByText(/Lat:/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /enviar/i }));
    expect(mockedCreateRequest).not.toHaveBeenCalled();
  });

  it("reseta formulario apos envio bem-sucedido", async () => {
    const user = userEvent.setup();
    mockedCreateRequest.mockResolvedValue({
      id: "abc",
      provider: "gemini",
      status: "Pendente",
      category: "Infraestrutura e Conservação do Mobiliário Urbano",
      priority: "Alta",
      technicalSummary: "Resumo técnico de teste com tamanho suficiente.",
    });

    render(<ReportForm />);

    await user.type(
      screen.getByPlaceholderText("Ex: Buraco na rua"),
      "Buraco grande"
    );
    await user.type(
      screen.getByPlaceholderText("Descreva o problema"),
      "Descricao detalhada"
    );
    await user.click(screen.getByRole("button", { name: "mock-select-point" }));
    await user.click(screen.getByRole("button", { name: /enviar/i }));

    await waitFor(() => {
      expect(mockedCreateRequest).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByPlaceholderText("Ex: Buraco na rua")).toHaveValue("");
    expect(screen.getByPlaceholderText("Descreva o problema")).toHaveValue("");
    expect(screen.queryByText(/Lat:/i)).not.toBeInTheDocument();
    expect(screen.getByText(/solicitação enviada/i)).toBeInTheDocument();
  });
});
