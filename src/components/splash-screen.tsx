"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import "./splash-screen.css";

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="splash-screen">
      <div className="splash-logo">
        <Image
          src="/logo1.png"
          alt="Árbitros"
          width={250}
          height={100}
          className="h-auto w-auto"
          priority
        />
      </div>
    </div>
  );
}
