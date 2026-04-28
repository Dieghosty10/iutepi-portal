const fs = require('fs');
const path = require('path');

const dir = './';
const files = fs.readdirSync(dir);
const htmlFiles = files.filter(f => f.endsWith('.html'));

// 1. Footers, Logos, Redes Sociales, Trabajo de Grado, Sistema en Linea
for (const file of htmlFiles) {
  let content = fs.readFileSync(file, 'utf8');

  // Quitar twitter
  content = content.replace(/<a href="[^"]*"[^>]*><i class="fab fa-twitter"><\/i><\/a>/g, '');
  content = content.replace(/<i class="fab fa-twitter"[^>]*><\/i>/g, '');
  // Quitar youtube
  content = content.replace(/<a href="[^"]*"[^>]*><i class="fab fa-youtube"><\/i><\/a>/g, '');
  content = content.replace(/<i class="fab fa-youtube"[^>]*><\/i>/g, '');

  // Actualizar Facebook
  content = content.replace(/<a href="[^"]*" aria-label="Facebook"/g, '<a href="https://www.facebook.com/iutepi.institutouniversitario/" aria-label="Facebook" target="_blank"');
  
  // Actualizar Instagram
  content = content.replace(/<a href="[^"]*" aria-label="Instagram"/g, '<a href="https://www.instagram.com/iutepi.valencia/?hl=es" aria-label="Instagram" target="_blank"');

  // Quitar "Trabajo de Grado"
  content = content.replace(/<p>Desarrollado para el Trabajo de Grado\.<\/p>/g, '');

  // Quitar "Sistema en Línea"
  content = content.replace(/<div class="footer-contact-item">\s*<i class="fas fa-desktop"><\/i>\s*<a href="[^"]*" target="_blank">Sistema en Línea<\/a>\s*<\/div>/g, '');
  content = content.replace(/<li><a href="[^"]*" target="_blank"><i class="fas fa-chevron-right"[^>]*><\/i> Sistema en Línea<\/a><\/li>/g, '');

  // Poner el Logo en el footer
  content = content.replace(/<div class="footer-logo-fallback"[^>]*>IU<span>TEPI<\/span><\/div>/g, '');
  content = content.replace(/<h3 class="footer-title">IUTEPI<\/h3>/g, '<img src="assets/images/logo-iutepi.png" alt="Logo IUTEPI" style="max-height: 50px; margin-bottom: 15px;">');
  content = content.replace(/<img src="assets\/images\/logo-iutepi\.png" alt="IUTEPI" style="height:38px;filter:brightness\(0\) invert\(1\);" onerror="" \/>/g, '<img src="assets/images/logo-iutepi.png" alt="Logo IUTEPI" style="max-height: 50px; filter:brightness(0) invert(1);">');

  // Agregar 6 semestres a carreras.html
  if (file === 'carreras.html') {
    const quintoRegex = /<div class="semester-title">Quinto Semestre<\/div>\s*<ul class="semester-subjects">([\s\S]*?)<\/ul>\s*<\/div>\s*<\/div>/g;
    
    // We will append a 6th semester right after the 5th semester block
    // Wait, the match captures the subjects but we want to append.
    // Instead of complex regex, let's just do a manual string split or replace.
    const arr = content.split('<div class="semester-title">Quinto Semestre</div>');
    if (arr.length > 1) {
        let newContent = arr[0];
        for(let i=1; i<arr.length; i++){
            // We need to find the end of the ul and its parent divs.
            // A simpler way: we know it ends with </ul></div></div>
            // Actually let's just replace the exact block if we can find it, or use a simpler regex.
            const sixthSemester = `
                  <div class="reveal reveal-delay-2">
                    <div class="semester-title">Sexto Semestre</div>
                    <ul class="semester-subjects">
                      <li>Proyecto de Grado</li>
                      <li>Pasantías Profesionales</li>
                    </ul>
                  </div>
                </div>`;
            // It's easier to just do it via DOM, but we are using regex.
            // Let's replace the last </div> with the new semester.
        }
    }
  }

  // Quitar stats-strip en metodologias.html
  if (file === 'metodologias.html') {
    content = content.replace(/<section class="stats-strip">[\s\S]*?<\/section>/, '');
  }

  // Navbar - Remove Sistema en linea
  content = content.replace(/<a href="[^"]*" target="_blank" class="nav-link">Sistema en Línea<\/a>/g, '');

  fs.writeFileSync(file, content, 'utf8');
}

// 2. Modificar js/data.js (6to Semestre)
let dataJs = fs.readFileSync('js/data.js', 'utf8');
// Replace Semestre 5 to not have Proyecto de Grado/Pasantias Fase II, and add Semestre 6
dataJs = dataJs.replace(/{ semestre: 5, nombre: "Quinto Semestre", materias: \["Proyecto de Investigación Tecnológica", "Electiva II", "Seminario de Grado", "Pasantías Fase II"\] }/g, 
  `{ semestre: 5, nombre: "Quinto Semestre", materias: ["Proyecto de Investigación Tecnológica", "Electiva II", "Seminario de Grado"] },
        { semestre: 6, nombre: "Sexto Semestre", materias: ["Proyecto de Grado", "Pasantías Fase II"] }`);
dataJs = dataJs.replace(/{ semestre: 5, nombre: "Quinto Semestre", materias: \["Proyecto de Investigación", "Electiva II", "Seminario de Grado", "Pasantías Fase II"\] }/g, 
  `{ semestre: 5, nombre: "Quinto Semestre", materias: ["Proyecto de Investigación", "Electiva II", "Seminario de Grado"] },
        { semestre: 6, nombre: "Sexto Semestre", materias: ["Proyecto de Grado", "Pasantías Fase II"] }`);
fs.writeFileSync('js/data.js', dataJs, 'utf8');

// 3. Modificar js/chatbot.js (6to Semestre pensum strings)
let chatJs = fs.readFileSync('js/chatbot.js', 'utf8');
chatJs = chatJs.replace(/\*\*Sem 5:\*\* Proyecto de Grado, Electiva II, Seminario, Pasantías II/g, 
  `**Sem 5:** Proyecto de Investigación, Electiva II, Seminario\\n**Sem 6:** Proyecto de Grado, Pasantías II`);
chatJs = chatJs.replace(/Sem5: Proyecto de Grado, Electiva II, Seminario, Pasantías II/g, 
  `Sem5: Proyecto de Inv, Electiva II, Seminario | Sem6: Proyecto de Grado, Pasantías II`);
fs.writeFileSync('js/chatbot.js', chatJs, 'utf8');

console.log("Done");
