"use client";

import { useState } from "react";
import html2canvas from "html2canvas-pro";
import { Button } from "@/components/ui/button";
import { Share2, Loader2 } from "lucide-react";

const PARTIDOS_LIST_SHARE_ID = "partidos-list-share";
const SHARE_TEXT =
  "Acabo de compartir un partido gracias a Bah, Yo paso! JC y Manute son la ostia!!!";

const COLOR_VARS = [
  "background", "foreground", "card", "card-foreground", "primary", "primary-foreground",
  "secondary", "secondary-foreground", "muted", "muted-foreground", "border", "destructive",
  "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
] as const;

function getComputedRgbForVar(varName: string): string {
  const el = document.createElement("div");
  el.style.color = `var(--${varName})`;
  el.style.position = "absolute";
  el.style.visibility = "hidden";
  document.body.appendChild(el);
  const rgb = getComputedStyle(el).color;
  document.body.removeChild(el);
  return rgb || "transparent";
}

function copyComputedColors(original: Element, clone: Element) {
  const c = getComputedStyle(original);
  const s = (clone as HTMLElement).style;
  s.color = c.color;
  s.backgroundColor = c.backgroundColor;
  s.borderColor = c.borderColor;
  s.borderTopColor = c.borderTopColor;
  s.borderRightColor = c.borderRightColor;
  s.borderBottomColor = c.borderBottomColor;
  s.borderLeftColor = c.borderLeftColor;
  s.outlineColor = c.outlineColor;
  s.textDecorationColor = c.textDecorationColor;
  const origChildren = Array.from(original.children);
  const cloneChildren = Array.from(clone.children);
  for (let i = 0; i < origChildren.length && i < cloneChildren.length; i++) {
    copyComputedColors(origChildren[i], cloneChildren[i]);
  }
}

function injectRgbOverrides(clonedDoc: Document, clonedRoot: HTMLElement, originalRoot: Element) {
  const declarations = COLOR_VARS.map((name) => `--${name}: ${getComputedRgbForVar(name)}`);
  const style = clonedDoc.createElement("style");
  style.textContent = `:root, .dark { ${declarations.join(";\n  ")} }`;
  clonedDoc.head.appendChild(style);
  copyComputedColors(originalRoot, clonedRoot);
}

export function SharePartidosButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleShare() {
    const el = document.getElementById(PARTIDOS_LIST_SHARE_ID);
    setError(null);
    if (!el) {
      setError("No hay partidos para compartir.");
      return;
    }
    setLoading(true);
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc, clonedElement) => {
          injectRgbOverrides(clonedDoc, clonedElement, el);
        },
      });
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png", 0.95);
      });
      if (!blob) {
        setError("No se pudo generar la imagen.");
        return;
      }
      const file = new File([blob], "partidos.png", { type: "image/png" });
      if (navigator.share) {
        try {
          if (navigator.canShare?.({ files: [file] }) !== false) {
            await navigator.share({
              title: "Partidos",
              text: SHARE_TEXT,
              files: [file],
            });
          } else {
            openImageInNewTab(blob);
          }
        } catch (err) {
          const e = err as { name?: string };
          if (e.name !== "AbortError") openImageInNewTab(blob);
        }
      } else {
        openImageInNewTab(blob);
      }
    } catch (err) {
      console.error("[SharePartidos]", err);
      setError("No se pudo crear la captura. Prueba de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function openImageInNewTab(blob: Blob) {
    const url = URL.createObjectURL(blob);
    if (!window.open(url, "_blank", "noopener")) {
      const a = document.createElement("a");
      a.href = url;
      a.download = "partidos.png";
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleShare}
        disabled={loading}
        aria-label="Compartir"
      >
        {loading ? (
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
        ) : (
          <Share2 className="mr-2 size-4" aria-hidden />
        )}
        Compartir
      </Button>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export { PARTIDOS_LIST_SHARE_ID };
