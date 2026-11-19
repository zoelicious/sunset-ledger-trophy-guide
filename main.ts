// Sunset Ledger — a GTA VI trophy guide and tracker (gta6-trophy-guide-01).
// Node 22, standard library only. The guide itself is plain static files in
// app/ (index.html, style.css, app.js, data/trophies.json): it opens in desktop
// Chrome with the network off and loads nothing from outside app/.
// This program hands the guide in: it copies app/ and screenshots/ from beside
// this file into /output and writes /output/dossier.json with the vendored
// make.fun library, exactly as the kit's starter does. vendor/makefun-frontend.ts
// is the kit's copy, unchanged; the scorer rebuilds the dossier with its own
// copy and compares the two byte for byte.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps: only text_max_bytes shapes the bytes; the others refuse
// an entry the scorer would refuse (more than 4 screenshots or one over 256 KiB;
// more than 993 files and directories in app/ or 48 MiB of app files).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
