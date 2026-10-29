// Henter siste 9 innlegg fra @moremusic.no via Composio, lagrer bilder lokalt (docs/instagram/)
// og skriver docs/instagram/feed.json. Feiler noe, endres ingenting og jobben feiler (GitHub varsler på e-post).
import { writeFile, readFile, access, mkdir } from "node:fs/promises";

const COUNT = 9;
const OUT = "docs/instagram";
const [owner, repo] = (process.env.GITHUB_REPOSITORY || "bruker/repo").split("/");
const BASE = (process.env.PUBLIC_BASE || `https://${owner}.github.io/${repo}`).replace(/\/$/, "");
const KEY = process.env.COMPOSIO_API_KEY;
if (!KEY) throw new Error("Mangler COMPOSIO_API_KEY");

const exists = (p) => access(p).then(() => true, () => false);
const shorten = (t = "") => {
  const s = t.replace(/\s+/g, " ").trim();
  return s.length <= 140 ? s : s.slice(0, 139).trimEnd() + "…";
};
const utc = (ts) => new Date(ts).toISOString().replace(/\.\d+Z$/, "Z");

async function listMedia() {
  const body = {
    arguments: {
      ig_user_id: "me",
      limit: 30,
      fields: "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp",
    },
  };
  if (process.env.COMPOSIO_ACCOUNT_ID) body.connected_account_id = process.env.COMPOSIO_ACCOUNT_ID;
  body.user_id = process.env.COMPOSIO_USER_ID || "pg-test-e9f8c9c1-fb73-45fa-9cc7-8b88fcef1333";
  const r = await fetch("https://backend.composio.dev/api/v3.1/tools/execute/INSTAGRAM_GET_IG_USER_MEDIA", {
    method: "POST",
    headers: { "x-api-key": KEY, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.successful === false) throw new Error(`Composio-feil: ${JSON.stringify(j).slice(0, 300)}`);
  const d = j.data?.data ?? j.data;
  const items = Array.isArray(d) ? d : d?.data;
  if (!Array.isArray(items)) throw new Error(`Uventet svar: ${JSON.stringify(j).slice(0, 300)}`);
  return items;
}

const pickImage = (m) =>
  m.media_type === "VIDEO" ? m.thumbnail_url : m.media_type === "IMAGE" || m.media_type === "CAROUSEL_ALBUM" ? m.media_url : null;

await mkdir(OUT, { recursive: true });
const posts = [];
for (const m of await listMedia()) {
  if (posts.length >= COUNT) break;
  const src = pickImage(m);
  if (!src) continue;
  const file = `${OUT}/${m.id}.jpg`;
  if (!(await exists(file))) {
    const r = await fetch(src);
    if (!r.ok) throw new Error(`Bildenedlasting feilet for ${m.id}: ${r.status}`);
    await writeFile(file, Buffer.from(await r.arrayBuffer()));
  }
  posts.push({ id: m.id, image: `${BASE}/instagram/${m.id}.jpg`, link: m.permalink, caption: shorten(m.caption), timestamp: utc(m.timestamp) });
}
if (posts.length === 0) throw new Error("Ingen innlegg funnet. Beholder forrige feed.json.");

const feed = { updated: "", profileUrl: "https://www.instagram.com/moremusic.no/", posts };
let old = null;
try { old = JSON.parse(await readFile(`${OUT}/feed.json`, "utf8")); } catch {}
if (!old || JSON.stringify(old.posts) !== JSON.stringify(posts)) {
  feed.updated = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  await writeFile(`${OUT}/feed.json`, JSON.stringify(feed, null, 2));
  console.log(`Oppdatert: ${posts.length} innlegg`);
} else {
  console.log("Ingen endringer");
}
