const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

const newSnippet = `        <li class="nav-item mobile-cta-container">
          <a href="aula-virtual.html" class="mobile-cta-btn btn-primary">
            <i class="fas fa-desktop"></i> Aula Virtual
          </a>
          <a href="requisitos.html" class="mobile-cta-btn btn-secondary">
            <i class="fas fa-edit"></i> Inscribirse
          </a>
        </li>
      </ul>`;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // First remove the old mobile-cta-container if it exists
  content = content.replace(/<li class="nav-item mobile-cta-container">[\s\S]*?<\/li>\s*<\/ul>/g, '</ul>');
  
  // Now inject the new one
  if (content.includes('class="navbar-menu"')) {
    content = content.replace(/<\/ul>\s*<div class="navbar-actions">/, newSnippet + '\n      <div class="navbar-actions">');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});
