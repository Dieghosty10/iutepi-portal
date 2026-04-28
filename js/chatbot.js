const IUTEPI_DATA = {
  nombre: "Instituto Universitario de Tecnología y Administración Industrial (IUTEPI)",
  fundacion: "1974",
  email: "iutepi@iutepi.edu",
  web: "https://www.iutepi.edu",
  aula_virtual: "http://virtual.iutepi.edu.ve/moodle/",
  sedes: ["Valencia (Carabobo) — Sede Principal", "Acarigua (Portuguesa)", "Guanare (Portuguesa)"],
  carreras: ["Análisis de Sistemas (TSU)", "Electrónica (TSU)", "Administración Industrial (TSU)"],
  duracion: "6 semestres — 3 años",
  modalidades: ["Presencial", "Semipresencial", "Virtual / A distancia"]
};
const CHATBOT_SYSTEM_PROMPT = `Eres PIA (Plataforma de Información Académica), el asistente oficial del IUTEPI.
INFORMACIÓN DEL IUTEPI:
- Nombre completo: Instituto Universitario de Tecnología y Administración Industrial (IUTEPI)
- Fundación: 1974
- Email: iutepi@iutepi.edu
- Aula virtual: virtual.iutepi.edu.ve/moodle/
- Sedes: Valencia (Carabobo) sede principal, Acarigua (Portuguesa), Guanare (Portuguesa)
CARRERAS (todas duran 6 semestres = 3 años, título TSU):
1. ANÁLISIS DE SISTEMAS - Menciones: Gestión de Redes, Desarrollo Web
   Pensum: Sem1: Matemática I, Inglés I, Programación I, Intro Computación, SSOO I, Comunicación | Sem2: Matemática II, Inglés II, Programación II, Bases de Datos I, SSOO II, Metodología | Sem3: Matemática III, Programación III, BD II, Redes I, Ing Software I, Seguridad | Sem4: BD III, Redes II, Ing Software II, Admin Sistemas, Electiva I, Pasantías I | Sem5: Proyecto de Inv, Electiva II, Seminario | Sem6: Proyecto de Grado, Pasantías II
2. ELECTRÓNICA - Menciones: Canalizaciones Eléctricas, Automatización, PCB
   Pensum: Sem1: Física I, Matemática I, Electrónica Básica, Inglés I, Dibujo Técnico, Comunicación | Sem2: Física II, Matemática II, Electrónica Analógica, Inglés II, Circuitos, Metodología | Sem3: Matemática III, Electrónica Digital, Microprocesadores, Instrumentación, Señales y Sistemas, Microcontroladores | Sem4: Automatización Industrial, Control Industrial, Diseño PCB, Mantenimiento, Electiva I, Pasantías I | Sem5: Proyecto de Inv, Electiva II, Seminario | Sem6: Proyecto de Grado, Pasantías II
3. ADMINISTRACIÓN INDUSTRIAL - Menciones: Contaduría, Tributo, Banca Seguros y Negocios
   Pensum: Sem1: Matemática I, Inglés I, Contabilidad I, Economía, Comunicación, Intro Admin | Sem2: Matemática II, Inglés II, Contabilidad II, Derecho Mercantil, Estadística, Metodología | Sem3: Matemática Financiera, Costos, Admin I, Finanzas, Tributación, RR.II. | Sem4: Admin II, Análisis Financiero, Seguridad Industrial, Mercadeo, Electiva I, Pasantías I | Sem5: Proyecto de Inv, Electiva II, Seminario | Sem6: Proyecto de Grado, Pasantías II
REQUISITOS DE INSCRIPCIÓN:
1. Cédula de identidad (original + copia)
2. Partida de nacimiento (original + copia)  
3. Título de bachiller o constancia de culminación
4. Notas certificadas de bachillerato
5. 4 fotos tipo carnet fondo blanco
6. Preinscripción en sistema en línea: dnsiutepi.no-ip.net
METODOLOGÍAS: Presencial (lun-vie), Semipresencial (sábados + virtual), Virtual (100% online 24/7)
DIPLOMADOS Y CERTIFICADOS: Seguridad Informática (6m), Automatización Industrial (6m), Contable y Tributaria (4m), Redes y Comunicaciones (5m)
REGLAS DE NAVEGACIÓN Y COMPORTAMIENTO:
- Responde SIEMPRE en español amigable, respetuoso y formal.
- Sé específico con las materias y semestres.
- No uses emojis.
- Si consideras útil enviar al user a una sección para que extienda la información, INCLUYE un botón de navegación al final de tu respuesta usando ESTE formato OBLIGATORIO: [ACTION:url_destino:Texto del Boton]
Ejemplos de páginas válidas para redirigir:
- carreras.html#sistemas
- carreras.html#electronica
- carreras.html#administracion
- institucion.html
- metodologias.html
- requisitos.html
- sedes.html
- diplomados.html
Ejemplo real de respuesta: "El IUTEPI ofrece la carrera de Análisis de Sistemas que dura 6 semestres. [ACTION:carreras.html#sistemas:Ver Pensum Detallado]"`;
class PIAChatbot {
  constructor() {
    this.apiKey = localStorage.getItem('pia_api_key') || '';
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    this.conversationHistory = [];
    this.isOpen = false;
    this.isTyping = false;
    this.unreadCount = 0;
    this.quickReplies = [
      { text: '¿Qué carreras hay?', icon: ' ' },
      { text: '¿Cómo me inscribo?', icon: ' ' },
      { text: 'Sede más cercana', icon: ' ' },
      { text: '¿Tienen modalidad virtual?', icon: ' ' },
      { text: 'Materias de Sistemas', icon: ' ' },
      { text: 'Materias de Electrónica', icon: ' ' },
    ];
    this.localAnswers = this.buildLocalAnswers();
    this.initDOM();
    this.bindEvents();
    setTimeout(() => this.showGreeting(), 1500);
  }
  buildLocalAnswers() {
    return [
      {
        keywords: ['carrera', 'estudia', 'ofrecen', 'tienen', 'tsu'],
        answer: `El IUTEPI ofrece **3 carreras** de Técnico Superior Universitario:\n\n• **Análisis de Sistemas** — Programación, redes, BD, desarrollo web\n• **Electrónica** — Circuitos, automatización, PCB, microprocesadores\n• **Administración Industrial** — Contabilidad, finanzas, tributos, banca\n\nTodas duran **6 semestres (3 años)**. ¿Cuál te interesa?`,
        action: { label: "Ver Todas las Carreras", url: "carreras.html" }
      },
      {
        keywords: ['inscri', 'requisito', 'documento', 'ingresar', 'entrar', 'cupo'],
        answer: `Para inscribirte necesitas:\n\n**Documentos personales:**\n• Cédula de identidad\n• Partida de nacimiento\n• 4 fotos carnet fondo blanco\n\n**Documentos académicos:**\n• Título de bachiller (o constancia de culminación)\n• Notas certificadas de bachillerato\n\n**Proceso:**\n1. Preinscríbete en línea: dnsiutepi.no-ip.net\n2. Consigna los documentos en la sede\n3. Paga los aranceles\n4. Recibe tu comprobante\n\n¿Necesitas más detalles?`,
        action: { label: "Ir a Requisitos", url: "requisitos.html" }
      },
      {
        keywords: ['dura', 'tiempo', 'año', 'semestre'],
        answer: `Las carreras del IUTEPI duran **6 semestres = 3 años**.\n\nCada semestre incluye materias específicas más prácticas. El diseño permite que puedas trabajar mientras estudias, especialmente en modalidad semipresencial o virtual.`
      },
      {
        keywords: ['virtual', 'distancia', 'online', 'linea', 'remoto', 'modalidad', 'horario'],
        answer: `El IUTEPI tiene **3 modalidades**:\n\n**Presencial** — Lunes a viernes en sede\n**Semipresencial** — Sábados presenciales + virtual entre semana (ideal para quienes trabajan)\n**Virtual/A distancia** — 100% online vía Moodle, sin ir a la sede\n\nAccede al aula virtual en: **virtual.iutepi.edu.ve/moodle/**`,
        action: { label: "Ver Modalidades de Estudio", url: "metodologias.html" }
      },
      {
        keywords: ['sistema', 'informatica', 'computacion', 'programacion', 'software', 'codigo', 'web', 'redes', 'materia'],
        answer: `**Análisis de Sistemas** — TSU, 6 semestres\n\n**Menciones:** Gestión de Redes | Desarrollo Web\n\n**Pensum:**\n**Sem 1:** Matemática I, Inglés I, Lenguajes de Programación I, Intro. a la Computación, Sistemas Operativos I, Comunicación\n**Sem 2:** Matemática II, Inglés II, Programación II, Bases de Datos I, SSOO II, Metodología\n**Sem 3:** Matemática III, Programación III, BD II, Redes I, Ingeniería de Software, Seguridad Informática\n**Sem 4:** BD III, Redes II, Ing. Software II, Admin. de Sistemas, Electiva I, Pasantías I\n**Sem 5:** Proyecto de Investigación, Electiva II, Seminario\n**Sem 6:** Proyecto de Grado, Pasantías II`,
        action: { label: "Ver Pensum Detallado", url: "carreras.html#sistemas" }
      },
      {
        keywords: ['electronica', 'electrónica', 'circuito', 'micro', 'arduino', 'automatizacion', 'pcb', 'placa'],
        answer: `**Electrónica** — TSU, 6 semestres\n\n**Menciones:** Canalizaciones Eléctricas | Automatización | PCB\n\n**Pensum:**\n**Sem 1:** Física I, Matemática I, Electrónica Básica, Inglés I, Dibujo Técnico, Comunicación\n**Sem 2:** Física II, Matemática II, Electrónica Analógica, Inglés II, Circuitos Eléctricos, Metodología\n**Sem 3:** Electrónica Digital, Microprocesadores, Instrumentación, Señales y Sistemas, Microcontroladores\n**Sem 4:** Automatización Industrial, Control Industrial, Diseño de PCB, Mantenimiento, Electiva I, Pasantías I\n**Sem 5:** Proyecto de Investigación, Electiva II, Seminario\n**Sem 6:** Proyecto de Grado, Pasantías II`,
        action: { label: "Ver Pensum de Electrónica", url: "carreras.html#electronica" }
      },
      {
        keywords: ['administra', 'contab', 'tribut', 'empresa', 'banca', 'finanza', 'negocios'],
        answer: `**Administración Industrial** — TSU, 6 semestres\n\n**Menciones:** Contaduría | Tributo | Banca, Seguros y Negocios\n\n**Pensum:**\n**Sem 1:** Matemática I, Inglés I, Contabilidad I, Economía, Comunicación, Intro. Admin.\n**Sem 2:** Matemática II, Inglés II, Contabilidad II, Derecho Mercantil, Estadística, Metodología\n**Sem 3:** Matemática Financiera, Contabilidad de Costos, Admin. I, Finanzas, Tributación, RRII\n**Sem 4:** Admin. II, Análisis Financiero, Seguridad Industrial, Mercadeo, Electiva I, Pasantías I\n**Sem 5:** Proyecto de Investigación, Electiva II, Seminario\n**Sem 6:** Proyecto de Grado, Pasantías II`,
        action: { label: "Ver Pensum de Administración", url: "carreras.html#administracion" }
      },
      {
        keywords: ['sede', 'donde', 'ubicacion', 'ciudad', 'valencia', 'acarigua', 'guanare', 'portuguesa', 'carabobo', 'direccion', 'lugar'],
        answer: `El IUTEPI tiene **3 ubicaciones** en Venezuela:\n\n**Sede Principal** — Valencia, Estado Carabobo (todas las carreras)\n**Extensión Acarigua** — Acarigua, Estado Portuguesa\n**Ampliación Guanare** — Guanare, Estado Portuguesa\n\n¡Y con modalidad **virtual** puedes estudiar desde cualquier lugar del país o el mundo!`,
        action: { label: "Conoce Nuestras Sedes", url: "sedes.html" }
      },
      {
        keywords: ['contacto', 'telefono', 'email', 'correo', 'comunica', 'habla', 'escribi', 'numero', 'whatsapp'],
        answer: `Contacta al IUTEPI:\n\n**Email:** iutepi@iutepi.edu\n**Web:** www.iutepi.edu\n**Sistema en línea:** dnsiutepi.no-ip.net\n**Aula virtual:** virtual.iutepi.edu.ve/moodle/\n\nO visita la sede principal en **Valencia, Estado Carabobo**.`,
        action: { label: "Ir a Contacto", url: "contacto.html" }
      },
      {
        keywords: ['costo', 'precio', 'pago', 'arancel', 'gratis', 'cuanto'],
        answer: `El IUTEPI es una institución **oficial y autorizada**. Los aranceles son muy accesibles comparado con universidades privadas.\n\nPara costos actualizados, contacta directamente: **iutepi@iutepi.edu** o visita la sede en Valencia, Carabobo. Los montos varían según el período.`
      },
      {
        keywords: ['diplomado', 'certificad', 'curso'],
        answer: `El IUTEPI ofrece **Diplomados** de especialización:\n\n**Seguridad Informática** — 6 meses, semipresencial\n**Automatización Industrial** — 6 meses, presencial\n**Contable y Tributaria** — 4 meses, semipresencial\n**Redes y Comunicaciones** — 5 meses, virtual\n\n¡Ideales para quienes quieren actualizarse o especializarse! Para más info: iutepi@iutepi.edu`,
        action: { label: "Ver Diplomados", url: "diplomados.html" }
      },
      {
        keywords: ['mision', 'misión', 'vision', 'visión', 'que es iutepi', 'historia', 'fundacion', 'fundación'],
        answer: `**El IUTEPI** (Instituto Universitario de Tecnología y Administración Industrial) fue fundado en **1974**.\n\n**Misión:** Formar Técnicos Superiores Universitarios en Tecnología y Administración Industrial, respondiendo a las necesidades del país.\n\n**Visión:** Ser institución de referencia nacional en formación de TSU innovadores, creativos y comprometidos con Venezuela.\n\n¿Te gustaría saber más sobre las carreras o el proceso de inscripción?`,
        action: { label: "Sobre la Institución", url: "institucion.html" }
      },
      {
        keywords: ['trabajar', 'trabajo', 'estudia y trabaja', 'compatible'],
        answer: `¡Absolutamente! El IUTEPI está diseñado para esto:\n\n**Modalidad Semipresencial:** Asiste solo los sábados y estudia virtualmente el resto de la semana. ¡La favorita de quienes trabajan!\n\n**Modalidad Virtual:** 100% en línea, estudia en tus horas libres, acceso 24/7.\n\nIncluso en modalidad **presencial** puedes elegir el turno de mañana o tarde según tu trabajo.`
      }
    ];
  }
  initDOM() {
    const html = `
      <div class="chat-fab" id="chat-fab">
        <div class="chat-tooltip">¡Pregúntame sobre el IUTEPI!</div>
        <button class="chat-fab-btn" id="chat-fab-btn" aria-label="Abrir chat con PIA">
          <span class="icon-open"><i class="fas fa-comment-dots"></i></span>
          <span class="icon-close"><i class="fas fa-times"></i></span>
        </button>
        <div class="chat-fab-badge" id="chat-badge">1</div>
      </div>

      <div class="chat-panel" id="chat-panel" role="dialog" aria-label="Chat con PIA - Asistente IUTEPI">
        <div class="chat-header">
          <div class="chat-avatar">
            PIA
            <span class="chat-avatar-status"></span>
          </div>
          <div class="chat-header-info">
            <div class="chat-header-name">PIA — Asistente IUTEPI</div>
            <div class="chat-header-status">
              <i class="fas fa-circle" style="font-size:6px"></i>
              En línea · Navega contigo
            </div>
          </div>
          <div class="chat-header-actions">
            <button class="chat-action-btn" id="chat-clear-btn" title="Limpiar chat" aria-label="Limpiar chat">
              <i class="fas fa-trash-alt"></i>
            </button>
            <button class="chat-action-btn" id="chat-close-btn" title="Cerrar" aria-label="Cerrar chat">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div class="chat-messages" id="chat-messages" aria-live="polite"></div>

        <div class="chat-quick-replies" id="chat-quick-replies"></div>

        <div class="chat-input-area">
          <div class="chat-input-wrap">
            <textarea
              id="chat-input"
              class="chat-input"
              placeholder="Escribe tu pregunta aquí..."
              rows="1"
              maxlength="500"
              aria-label="Mensaje para PIA"
            ></textarea>
          </div>
          <button class="chat-send-btn" id="chat-send-btn" title="Enviar" aria-label="Enviar mensaje">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);

    this.fab      = document.getElementById('chat-fab-btn');
    this.panel    = document.getElementById('chat-panel');
    this.messages = document.getElementById('chat-messages');
    this.input    = document.getElementById('chat-input');
    this.sendBtn  = document.getElementById('chat-send-btn');
    this.badge    = document.getElementById('chat-badge');
    this.quickEl  = document.getElementById('chat-quick-replies');

    this.renderQuickReplies();
  }
  renderQuickReplies() {
    this.quickEl.innerHTML = this.quickReplies.map(qr =>
      `<button class="quick-reply-btn" data-text="${qr.text}">${qr.icon} ${qr.text}</button>`
    ).join('');
    this.quickEl.querySelectorAll('.quick-reply-btn').forEach(btn => {
      btn.addEventListener('click', () => this.sendMessage(btn.dataset.text));
    });
  }
  bindEvents() {
    this.fab.addEventListener('click', () => this.toggle());
    document.getElementById('chat-close-btn').addEventListener('click', () => this.close());
    document.getElementById('chat-clear-btn').addEventListener('click', () => this.clear());
    this.sendBtn.addEventListener('click', () => this.handleSend());
    this.input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.handleSend(); }
    });
    this.input.addEventListener('input', () => {
      this.input.style.height = 'auto';
      this.input.style.height = Math.min(this.input.scrollHeight, 120) + 'px';
    });
  }
  toggle() { this.isOpen ? this.close() : this.open(); }
  open() {
    this.isOpen = true;
    this.fab.classList.add('active');
    this.panel.classList.add('open');
    this.badge.classList.add('hidden');
    this.unreadCount = 0;
    setTimeout(() => this.input.focus(), 300);
    this.scrollBottom();
  }
  close() {
    this.isOpen = false;
    this.fab.classList.remove('active');
    this.panel.classList.remove('open');
  }
  showGreeting() {
    this.addBot(`¡Hola! Soy **PIA**, tu asistente virtual del IUTEPI.\n\nEstoy aquí para ayudarte con:\n• Las carreras y sus materias\n• Proceso de inscripción\n• Sedes y modalidades\n• Requisitos y documentos\n\n¿En qué puedo ayudarte hoy?`);
    if (!this.isOpen) {
      this.unreadCount = 1;
      this.badge.textContent = '1';
      this.badge.classList.remove('hidden');
    }
  }
  async handleSend() {
    const text = this.input.value.trim();
    if (!text || this.isTyping) return;
    this.input.value = '';
    this.input.style.height = 'auto';
    await this.sendMessage(text);
  }
  async sendMessage(text) {
    if (!text || this.isTyping) return;
    this.addUser(text);
    this.showTyping();
    this.sendBtn.disabled = true;
    this.conversationHistory.push({ role: 'user', parts: [{ text }] });

    try {
      let response;
      if (this.apiKey) {
        response = await this.callGemini(text);
      } else {
        await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
        response = this.localAnswer(text);
      }
      this.hideTyping();
      this.addBot(response);
      
      const txtToPush = typeof response === 'string' ? response : response.answer;
      this.conversationHistory.push({ role: 'model', parts: [{ text: txtToPush }] });
    } catch (e) {
      this.hideTyping();
      this.addBot(this.localAnswer(text));
    } finally {
      this.sendBtn.disabled = false;
    }
  }
  async callGemini(userMsg) {
    const body = {
      system_instruction: { parts: [{ text: CHATBOT_SYSTEM_PROMPT }] },
      contents: this.conversationHistory,
      generationConfig: { temperature: 0.75, maxOutputTokens: 700, topP: 0.9 }
    };

    const res = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(`API Error ${res.status}`);
    const data = await res.json();
    const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!txt) throw new Error('Empty response');
    return txt;
  }
  localAnswer(text) {
    const lower = text.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[¿?¡!]/g, '');

    for (const item of this.localAnswers) {
      if (item.keywords.some(kw =>
        lower.includes(kw.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      )) return { answer: item.answer, action: item.action };
    }

    return { answer: `No entendí exactamente tu pregunta. Puedes intentar preguntarme:\n\n• **¿Qué carreras hay?**\n• **¿Cuáles son las materias de Sistemas?**\n• **¿Cómo me inscribo?**\n• **¿Tienen modalidad virtual?**\n• **¿Dónde están las sedes?**\n\nSi necesitas resolver dudas específicas, envía un correo a **iutepi@iutepi.edu**` };
  }
  addBot(response) {
    let textStr = typeof response === 'string' ? response : response.answer;
    let actionObj = typeof response === 'string' ? null : response.action;

    const actionRegex = /\[ACTION:(.+?):(.+?)\]/;
    const match = textStr.match(actionRegex);
    if(match) {
       actionObj = { url: match[1].trim(), label: match[2].trim() };
       textStr = textStr.replace(match[0], ''); 
    }

    textStr = textStr.trim();

    const div = document.createElement('div');
    div.className = 'chat-message bot';
    const time = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    
    let actionHTML = '';
    if (actionObj) {
       actionHTML = `<a href="${actionObj.url}" class="chat-action-link" title="Navegar: ${actionObj.label}">
         ${actionObj.label} <i class="fas fa-chevron-right" style="font-size:0.75rem;"></i>
       </a>`;
    }

    div.innerHTML = `
      <div class="msg-avatar"><i class="fas fa-robot"></i></div>
      <div>
        <div class="msg-bubble">${this.format(textStr)}${actionHTML}</div>
        <div class="msg-time">${time}</div>
      </div>`;
    this.messages.appendChild(div);
    this.scrollBottom();
    
    if (actionObj && actionObj.url) {
      setTimeout(() => {
        window.location.href = actionObj.url;
      }, 1500); 
    }
    
    if (!this.isOpen) {
      this.unreadCount++;
      this.badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
      this.badge.classList.remove('hidden');
    }
  }

  addUser(text) {
    const div = document.createElement('div');
    div.className = 'chat-message user';
    const time = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = `
      <div class="msg-avatar"><i class="fas fa-user"></i></div>
      <div>
        <div class="msg-bubble">${this.esc(text)}</div>
        <div class="msg-time">${time}</div>
      </div>`;
    this.messages.appendChild(div);
    this.scrollBottom();
  }

  format(text) {
    return text
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,'<em>$1</em>')
      .replace(/^([•\-]) (.+)$/gm,'<li><i class="fas fa-circle" style="font-size:6px;color:var(--primary);margin-right:6px;"></i>$2</li>')
      .replace(/(<li>[\s\S]*?<\/li>)+/g,'<ul>$&</ul>')
      .replace(/\n/g,'<br>');
  }

  esc(t) {
    return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  showTyping() {
    this.isTyping = true;
    const div = document.createElement('div');
    div.className = 'chat-typing'; div.id = 'chat-typing';
    div.innerHTML = `
      <div class="msg-avatar"><i class="fas fa-robot"></i></div>
      <div class="typing-bubble">
        <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
      </div>`;
    this.messages.appendChild(div);
    this.scrollBottom();
  }

  hideTyping() {
    this.isTyping = false;
    document.getElementById('chat-typing')?.remove();
  }

  scrollBottom() {
    setTimeout(() => {
      this.messages.scrollTop = this.messages.scrollHeight;
    }, 50);
  }

  clear() {
    this.messages.innerHTML = '';
    this.conversationHistory = [];
    this.showGreeting();
  }

  setApiKey(key) {
    this.apiKey = key.trim();
    if (this.apiKey) localStorage.setItem('pia_api_key', this.apiKey);
    else localStorage.removeItem('pia_api_key');
  }
}
document.addEventListener('DOMContentLoaded', () => {
  window.piaChatbot = new PIAChatbot();
});
