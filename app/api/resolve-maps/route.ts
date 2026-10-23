import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const HOST_OK = /(^|\.)(goo\.gl|google\.[a-z.]+)$/;

const USER_AGENTS = [
  "curl/8.4.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
];

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

function unescapeText(t: string): string {
  return t
    .replace(/\\u003d/gi, "=")
    .replace(/\\u0026/gi, "&")
    .replace(/\\u002F/gi, "/")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&");
}

function findMapsUrls(body: string): string[] {
  const t = unescapeText(body);
  const found = t.match(/https?:\/\/[^"'\s<>\\]+/g) || [];
  return found.filter((u) => /google\.[a-z.]+\/maps|maps\.google|goo\.gl/.test(u));
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
  const bodies: string[] = [];
  let coords = parseCoords(link);

  for (const ua of USER_AGENTS) {
    if (coords) break;
    let url = link;
    try {
      for (let i = 0; i < 8 && !coords; i++) {
        const res = await fetch(url, {
          redirect: "manual",
          headers: { "User-Agent": ua, "Accept-Language": "vi,en;q=0.9" },
        });
        hops.push(`${ua.slice(0, 6)} ${res.status} ${url.slice(0, 120)}`);

        const loc = res.headers.get("location");
        if (loc) {
          url = new URL(loc, url).toString();
          coords = parseCoords(url);
          if (!coords && !HOST_OK.test(new URL(url).hostname)) break;
          continue;
        }

        const body = await res.text();
        bodies.push(body.slice(0, 400));
        coords = parseCoords(unescapeText(body));
        if (!coords) {
          const next = findMapsUrls(body).find((u) => u !== url);
          if (next) {
            url = next;
            coords = parseCoords(url);
            continue;
          }
        }
        break;
      }
    } catch (err) {
      hops.push("error " + String(err));
    }
  }

  return NextResponse.json(debug ? { coords, hops, bodies } : { coords });
}
