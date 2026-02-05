"use client";

import { useEffect, useState } from "react";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "En curso o finalizado";
  const sec = Math.floor(ms / 1000) % 60;
  const min = Math.floor(ms / 60000) % 60;
  const hours = Math.floor(ms / 3600000) % 24;
  const days = Math.floor(ms / 86400000);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} día${days !== 1 ? "s" : ""}`);
  if (hours > 0 || parts.length) parts.push(`${hours} h`);
  if (min > 0 || parts.length) parts.push(`${min} min`);
  parts.push(`${sec} s`);
  return parts.join(" ");
}

export function Countdown({ dateIso }: { dateIso: string }) {
  const [text, setText] = useState<string>("");

  useEffect(() => {
    const target = new Date(dateIso).getTime();
    const update = () => {
      const now = Date.now();
      setText(formatCountdown(target - now));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [dateIso]);

  return <span className="tabular-nums">{text}</span>;
}
