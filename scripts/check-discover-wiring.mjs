/**
 * Gate CI: cableado marketplace en EventsPage (sin auth).
 * Exit 1 si falta wiring o hay anti-patrones de blast-radius.
 */
import fs from "node:fs";

const pagePath = process.argv[2] || "packages/shell/src/pages/EventsPage.tsx";
if (!fs.existsSync(pagePath)) {
  console.error(`FAIL: no existe ${pagePath}`);
  process.exit(1);
}

const page = fs.readFileSync(pagePath, "utf8");
const required = [
  "fetchNearbyVenues",
  "fetchNearbyServices",
  "setPublishedVenues",
  "setNearbyServiceCards",
  "publishedVenues",
  "nearbyServiceCards",
];
const missing = required.filter((s) => !page.includes(s));

if (page.includes("shouldSkipDiscoverNetworkRefresh") && !page.includes("locationBoundFetched")) {
  missing.push("locationBoundFetched (skip sin marketplace)");
}

const enrich = page.indexOf("await enrichProviderAvatars");
const paint = page.indexOf("setPublishedVenues");
if (enrich >= 0 && paint >= 0 && enrich < paint) {
  missing.push("await enrichProviderAvatars antes de setPublishedVenues");
}

if (missing.length) {
  console.error("FAIL Descubre wiring:", missing.join(", "));
  process.exit(1);
}

console.log("PASS Descubre wiring (EventsPage)");
