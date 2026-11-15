"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FileDown, RotateCcw } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function SectionActions() {
  const pathname = usePathname();
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const requestReset = () => setConfirmOpen(true);
    window.addEventListener("payflow:clear-view", requestReset);
    return () => window.removeEventListener("payflow:clear-view", requestReset);
  }, []);

  function resetView() {
    window.location.assign(pathname);
  }

  return (
    <>
      <div className="flex items-center gap-2 print-hidden" data-print-hide>
        <Button
          type="button"
          size="sm"
          variant="outline"
          title="Imprimir o guardar esta sección como PDF"
          onClick={() => window.print()}
        >
          <FileDown />
          PDF
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          title="Restablecer filtros y búsqueda de esta sección"
          onClick={() => setConfirmOpen(true)}
        >
          <RotateCcw />
          Limpiar vista
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restablecer esta sección</DialogTitle>
            <DialogDescription>
              Se reiniciarán los filtros, la búsqueda y la selección. No se
              borran obligaciones, pagos ni registros de auditoría. Los cambios
              locales de demostración no guardados se perderán.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="button" onClick={resetView}>
              Restablecer vista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
