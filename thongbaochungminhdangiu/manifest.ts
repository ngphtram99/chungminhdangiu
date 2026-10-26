import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Together",
    short_name: "Together",
    description: "just for us",
    start_url: "/",
    display: "standalone",
    background_color: "#F0DEEA",
    theme_color: "#F0DEEA",
    icons: [{ src: "/icon.png", sizes: "any", type: "image/png" }],
  };
}
