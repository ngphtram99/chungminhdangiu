import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const HOST_OK = /(^|\.)(goo\.gl|google\.[a-z.]+)$/;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

function parseCoords(raw: string): { lat: number; lng: number } | null {
  let s = raw;
  for (let i = 0; i < 3; i++) {
    const m =
      s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
      s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
    try {
      const d = decodeURIComponent(s);
      if (d === s) break;
      s = d;
    } catch {
      break;
    }
  }
  return null;
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const link = params.get("link");
  const debug = params.get("debug") === "1";
  if (!link) return NextResponse.json({ coords: null }, { status: 400 });

  try {
    if (!HOST_OK.test(new URL(link).hostname)) {
      return NextResponse.json({ coords: null }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ coords: null }, { status: 400 });
  }

  const hops: string[] = [];
  let coords = parseCoords(link);
  let url = link;

  try {
    for (let i = 0; i < 8 && !coords; i++) {
      const res = await fetch(url, {
        redirect: "manual",
        headers: { "User-Agent": UA, "Accept-Language": "vi,en;q=0.9" },
      });
      hops.push(`${res.status} ${url}`);

      const loc = res.headers.get("location");
      if (!loc) {
        const text = (await res.text()).slice(0, 300000);
        coords = parseCoords(text);
        break;
      }

      url = new URL(loc, url).toString();
      coords = parseCoords(url);
      if (!coords && !HOST_OK.test(new URL(url).hostname)) break;
    }
  } catch (err) {
    hops.push("error " + String(err));
  }

  return NextResponse.json(debug ? { coords, hops } : { coords });
}
