/**
 * Builds a Google Maps embed URL that works WITHOUT an API key.
 * If the user pasted a full Google Maps share link, we still fall back
 * to a query-based embed built from the place name/address, since Maps
 * share links (maps.app.goo.gl / goo.gl/maps) can't be embedded directly
 * in an iframe.
 */
export function buildEmbedUrl(name: string, address: string): string {
  const query = encodeURIComponent(`${name} ${address}`.trim());
  return `https://www.google.com/maps?q=${query}&output=embed`;
}

export function buildDirectionsLink(name: string, address: string): string {
  const query = encodeURIComponent(`${name} ${address}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
