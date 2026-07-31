"use client";

import { MapPinned } from "lucide-react";
import CoupleHeader from "@/components/CoupleHeader";
import PhotoGallery from "@/components/PhotoGallery";

export default function Home() {
  return (
    <main className="w-full max-w-3xl mx-auto px-4 sm:px-8 pt-5 sm:pt-24 flex flex-col items-center text-center">
      <div className="flex items-center gap-1.5 text-coral-dark font-mono text-[10px] sm:text-xs tracking-widest uppercase mb-1.5 sm:mb-3">
        <MapPinned size={12} />
        <span>Chungminhdangiu</span>
      </div>
      <h1 className="font-display italic text-2xl sm:text-5xl font-semibold text-ink leading-tight mb-4 sm:mb-10">
        Những nơi tụi mình
        <br />
        đã và sẽ ghé qua
      </h1>

      <CoupleHeader />

      <PhotoGallery />
    </main>
  );
}
