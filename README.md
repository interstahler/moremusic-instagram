# Instagram-feed for moremusic.no

Daglig jobb (GitHub Actions, 05:17 UTC) henter de 9 siste innleggene fra @moremusic.no via Composio, lagrer nye bilder i docs/instagram/ og skriver docs/instagram/feed.json. GitHub Pages (mappen /docs) serverer filene over HTTPS.

Feed-URL: https://interstahler.github.io/moremusic-instagram/instagram/feed.json

Krever repo-secret COMPOSIO_API_KEY. Valgfri repo-variabel COMPOSIO_ACCOUNT_ID. Kan kjøres manuelt fra Actions-fanen (Run workflow).

Feiler jobben, endres ingenting og forrige feed.json blir liggende.
