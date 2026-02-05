"use client";

import { useState } from "react";
import html2canvas from "html2canvas-pro";
import { Button } from "@/components/ui/button";
import { Share2, Loader2 } from "lucide-react";

const SHARE_AREA_ID = "partido-share-area";

const COLOR_VARS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
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
  s.fill = c.fill;
  s.stroke = c.stroke;
  const origChildren = Array.from(original.children);
  const cloneChildren = Array.from(clone.children);
  for (let i = 0; i < origChildren.length && i < cloneChildren.length; i++) {
    copyComputedColors(origChildren[i], cloneChildren[i]);
  }
}

function injectRgbOverrides(clonedDoc: Document, clonedRoot: HTMLElement, originalRoot: Element) {
  const declarations: string[] = [];
  for (const name of COLOR_VARS) {
    const rgb = getComputedRgbForVar(name);
    declarations.push(`--${name}: ${rgb}`);
  }
  const style = clonedDoc.createElement("style");
  style.textContent = `:root, .dark { ${declarations.join(";\n  ")} }`;
  clonedDoc.head.appendChild(style);
  copyComputedColors(originalRoot, clonedRoot);
}

export function SharePartidoButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleShare() {
    const el = document.getElementById(SHARE_AREA_ID);
    setError(null);
    if (!el) {
      setError("No se encontró el contenido del partido.");
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
      const file = new File([blob], "partido.png", { type: "image/png" });
      const shared = await tryNativeShare(file, blob);
      if (!shared) {
        openImageInNewTab(blob);
      }
    } catch (err) {
      console.error("[SharePartido]", err);
      setError("No se pudo crear la captura. Prueba de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function tryNativeShare(file: File, blob: Blob): Promise<boolean> {
    if (!navigator.share) return false;
    try {
      if (navigator.canShare?.({ files: [file] }) !== false) {
        await navigator.share({ title: "Partido", files: [file] });
        return true;
      }
    } catch (err) {
      const e = err as { name?: string };
      if (e.name === "AbortError") return true;
    }
    return false;
  }

  function openImageInNewTab(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank", "noopener");
    if (!w) {
      const a = document.createElement("a");
      a.href = url;
      a.download = "partido.png";
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
        aria-label="Compartir el partido"
      >
        {loading ? (
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
        ) : (
          <Share2 className="mr-2 size-4" aria-hidden />
        )}
        Compartir partido
      </Button>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export { SHARE_AREA_ID };
