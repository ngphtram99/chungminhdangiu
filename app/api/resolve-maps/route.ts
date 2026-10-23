import { NextResponse } from "next/server";

const ALLOWED_HOSTS = [
  "maps.app.goo.gl",
  "goo.gl",
  "google.com",
  "www.google.com",
  "maps.google.com",
];

function parseCoords(url: string): { lat: number; lng: number } | null {
  const m =
    url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
    url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
}

export async function GET(req: Request) {
  const link = new URL(req.url).searchParams.get("link");
  if (!link) return NextResponse.json({ coords: null }, { status: 400 });

  let host: string;
  try {
    host = new URL(link).hostname;
  } catch {
    return NextResponse.json({ coords: null }, { status: 400 });
  }
  if (!ALLOWED_HOSTS.includes(host)) {
    return NextResponse.json({ coords: null }, { status: 400 });
  }

  // Link dài thì đọc thẳng, không cần mở
  const direct = parseCoords(link);
  if (direct) return NextResponse.json({ coords: direct });

  try {
    const res = await fetch(link, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      },
    });
    return NextResponse.json({ coords: parseCoords(res.url) });
  } catch {
    return NextResponse.json({ coords: null });
  }
}
