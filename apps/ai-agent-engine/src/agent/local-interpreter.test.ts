import { describe, expect, it } from "vitest";
import { interpretDashboardCommand } from "./local-interpreter";

describe("interpretDashboardCommand", () => {
  it("recognizes dashboard navigation in Spanish", () => {
    expect(interpretDashboardCommand("Abre conciliación")).toEqual({
      type: "navigate",
      href: "/conciliacion",
      label: "Conciliación",
    });
  });

  it("maps summary requests to read-only metrics", () => {
    expect(interpretDashboardCommand("¿Cuánto se ha cobrado?")).toEqual({
      type: "summary",
      metric: "collected",
    });
  });

  it("requires a human-reviewed flow for financial actions", () => {
    expect(interpretDashboardCommand("Genera cobros para noviembre")).toEqual({
      type: "financial_action",
      action: "create",
    });
  });

  it("supports page reset and PDF export without changing financial records", () => {
    expect(interpretDashboardCommand("Limpia esta sección")).toEqual({
      type: "reset_view",
    });
    expect(interpretDashboardCommand("Exporta esta pantalla a PDF")).toEqual({
      type: "export_pdf",
    });
  });
});
