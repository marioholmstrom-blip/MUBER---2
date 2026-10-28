import { cp, mkdir, rm, access } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
const root = process.cwd();
const output = resolve(root, 'web-dist');
if (!output.startsWith(root + sep)) throw new Error('Invalid public output path');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const path of ['index.html', 'legal', 'mercadopago', 'MARKETING']) {
  await access(resolve(root, path));
  await cp(resolve(root, path), resolve(output, path), { recursive: true });
}
console.log('Sitio publico preparado: web, paginas legales y activos web.');