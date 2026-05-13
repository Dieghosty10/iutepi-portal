const fs = require('fs');
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

const files = [
  { name: 'administracion', path: 'assets/pdfs/pensum-administracion.pdf' },
  { name: 'electronica', path: 'assets/pdfs/pensum-electronica.pdf' },
  { name: 'sistemas', path: 'assets/pdfs/pensum-sistemas.pdf' }
];

(async () => {
  for (const f of files) {
    const buf = fs.readFileSync(f.path);
    const data = await pdfParse(buf);
    console.log('=== ' + f.name.toUpperCase() + ' ===');
    console.log(data.text);
    console.log('');
  }
})();
