"use client";

import CoupleHeader from "@/components/CoupleHeader";
import PhotoGallery from "@/components/PhotoGallery";

export default function Home() {
  return (
    <main className="w-full max-w-3xl mx-auto px-4 sm:px-8 pt-6 sm:pt-16 flex flex-col items-center text-center">
      <p className="[font-family:var(--font-pixel)] text-coral-dark text-lg sm:text-2xl tracking-widest mb-4 sm:mb-6">
        CHUNGMINHDANGIU
      </p>

      <CoupleHeader />

      <PhotoGallery />
    </main>
  );
}
