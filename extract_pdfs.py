import subprocess
import sys

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

try:
    import pdfplumber
except ImportError:
    install('pdfplumber')
    import pdfplumber

files = [
    ('Administracion', 'assets/pdfs/pensum-administracion.pdf'),
    ('Electronica', 'assets/pdfs/pensum-electronica.pdf'),
    ('Sistemas', 'assets/pdfs/pensum-sistemas.pdf')
]

with open('extracted_pensums.txt', 'w', encoding='utf-8') as out:
    for name, path in files:
        out.write(f'=== {name.upper()} ===\n')
        try:
            with pdfplumber.open(path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        out.write(text + '\n')
        except Exception as e:
            out.write(f"Error: {e}\n")
        out.write('\n\n')

print("Done extracting to extracted_pensums.txt")
