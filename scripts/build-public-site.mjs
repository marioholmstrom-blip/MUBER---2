import { cp, mkdir, rm, access, readdir } from 'node:fs/promises';
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
await access(resolve(root, 'landings/out/choferes/index.html'));
for (const name of ['choferes', 'descargar', 'usuarios', '_next']) {
  await cp(resolve(root, 'landings/out', name), resolve(output, name), { recursive: true });
}
for (const name of await readdir(resolve(root, 'landings/public'))) {
  if (/\.(png|svg|jpg|jpeg|webp|ico)$/.test(name)) await cp(resolve(root, 'landings/public', name), resolve(output, name));
}
console.log('Sitio publico y cuatro rutas de landing preparados.');