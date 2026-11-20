// Leonida Legend — hand-in program for the gta6-trophy-guide-01 entry (Node 22, standard library only).
//
// The entry itself is the static guide under app/ (open app/index.html in a browser; it runs offline and
// loads nothing over the network). This program's whole job is to hand that guide in: copy app/ and
// screenshots/ from this repository into the output directory, then write dossier.json there with the
// kit's vendored buildDossier, so the dossier is byte for byte the one the scorer builds from the same
// files. vendor/makefun-frontend.ts is the kit's file and stays untouched on purpose.
//
// Run it the way the grader does, with MAKEFUN_OUTPUT_DIR standing in for /output outside the grader:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the guide locally with `node serve.ts` (http://localhost:8080).

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy the two payloads: the guide itself and the maker's screenshots of it.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoDir, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoDir, 'screenshots'))) {
  cpSync(join(repoDir, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Write the dossier under the scorer's own caps (the gate's limits): the text cap shapes the bytes;
// the rest make this program refuse only what the scorer would refuse anyway — at most 4 screenshots
// of at most 256 KiB each, at most 993 files and directories in app/, at most 48 MiB of app files.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
