import { readFileSync } from 'fs';

const files = [
  { name: 'administracion', path: 'assets/pdfs/pensum-administracion.pdf' },
  { name: 'electronica', path: 'assets/pdfs/pensum-electronica.pdf' },
  { name: 'sistemas', path: 'assets/pdfs/pensum-sistemas.pdf' }
];

const { default: pdfParse } = await import('pdf-parse');

for (const f of files) {
  const buf = readFileSync(f.path);
  const data = await pdfParse(buf);
  console.log('=== ' + f.name.toUpperCase() + ' ===');
  console.log(data.text);
  console.log('');
}
