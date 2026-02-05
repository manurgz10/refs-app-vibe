"use client";

import { useState } from "react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Share2, Loader2 } from "lucide-react";

const SHARE_AREA_ID = "partido-share-area";

export function SharePartidoButton() {
  const [loading, setLoading] = useState(false);

  async function handleShare() {
    const el = document.getElementById(SHARE_AREA_ID);
    if (!el) return;
    setLoading(true);
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: null,
      });
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setLoading(false);
            return;
          }
          const file = new File([blob], "partido.png", { type: "image/png" });
          if (navigator.share && navigator.canShare?.({ files: [file] })) {
            navigator
              .share({
                title: "Partido",
                files: [file],
              })
              .then(() => {})
              .catch((err) => {
                if (err.name !== "AbortError") {
                  fallbackDownload(blob);
                }
              })
              .finally(() => setLoading(false));
          } else {
            fallbackDownload(blob);
            setLoading(false);
          }
        },
        "image/png",
        0.95
      );
    } catch {
      setLoading(false);
    }
  }

  function fallbackDownload(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "partido.png";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
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
  );
}

export { SHARE_AREA_ID };
