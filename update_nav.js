const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
const snippet = `        <li class="nav-item mobile-cta-container">
          <a href="aula-virtual.html" class="navbar-cta" style="background:var(--text-primary);color:#fff;border-color:var(--text-primary);width:100%;justify-content:center;">
            <i class="fas fa-desktop"></i> Aula Virtual
          </a>
          <a href="requisitos.html" class="navbar-cta" style="width:100%;justify-content:center;">
            <i class="fas fa-edit"></i> Inscríbete
          </a>
        </li>
      </ul>`;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('class="navbar-menu"') && !content.includes('mobile-cta-container')) {
    content = content.replace(/<\/ul>\s*<div class="navbar-actions">/, snippet + '\n      <div class="navbar-actions">');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});
