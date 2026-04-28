const IUTEPI_DATA = {
  universidad: {
    nombre: "Instituto Universitario de Tecnología para la Informática",
    sigla: "IUTEPI",
    tipo: "Institución privada de estudios a nivel superior",
    fundacion: "1974",
    ubicacion: "Valencia, Estado Carabobo, Venezuela",
    email: "iutepi@iutepi.edu",
    telefono: "",
    web: "https://www.iutepi.edu",
    aula_virtual: "http://virtual.iutepi.edu.ve/moodle/",
    sistema_en_linea: "http://dnsiutepi.no-ip.net",
    redes_sociales: {
      facebook:  "https://facebook.com",
      instagram: "https://instagram.com",
      twitter:   "https://twitter.com",
      youtube:   "https://youtube.com"
    }
  },
  mision: "El IUTEPI es una institución de educación superior, cuya función primordial es la formación de Técnicos Superiores Universitarios en el ámbito de la Tecnología y la Administración Industrial, respondiendo a las necesidades del país en materia productiva y de servicios, promoviendo la investigación, la extensión cultural y el desarrollo sustentable de la región y la nación.",
  vision: "Ser una institución de educación superior de referencia nacional en la formación de Técnicos Superiores Universitarios innovadores, creativos y comprometidos socialmente, con alta calificación técnica y humanística, al servicio del desarrollo integral de Venezuela.",
  carta_filosofica: "El IUTEPI asume como principios fundamentales la excelencia académica, el humanismo, la responsabilidad social, la pertinencia con el entorno productivo y tecnológico, y el compromiso con el desarrollo del país. Nuestra institución forma profesionales con valores éticos, espíritu emprendedor, conciencia ciudadana y capacidad técnica para transformar su entorno.",
  objetivos: [
    "Formar Técnicos Superiores Universitarios competentes y actualizados tecnológicamente",
    "Promover la investigación aplicada para dar soluciones a problemas del entorno regional y nacional",
    "Fomentar la extensión universitaria, la cultura y el deporte",
    "Establecer vínculos con el sector productivo nacional e internacional",
    "Garantizar una formación integral que combine excelencia técnica y valores humanos"
  ],
  sedes: [
    {
      nombre: "Sede Principal — Valencia",
      ciudad: "Valencia",
      estado: "Carabobo",
      descripcion: "Sede central del IUTEPI, donde se ofrecen todas las carreras y diplomados. Cuenta con laboratorios especializados, biblioteca, canchas deportivas y aula virtual presencial.",
      carreras: ["Análisis de Sistemas", "Electrónica", "Administración Industrial"],
      instalaciones: ["Laboratorio de Computación", "Laboratorio de Electrónica", "Biblioteca", "Canchas Deportivas", "Auditorio"]
    },
    {
      nombre: "Extensión Acarigua",
      ciudad: "Acarigua",
      estado: "Portuguesa",
      descripcion: "Extensión del IUTEPI en Acarigua, Estado Portuguesa.",
      carreras: ["Administración Industrial", "Análisis de Sistemas"]
    },
    {
      nombre: "Ampliación Guanare",
      ciudad: "Guanare",
      estado: "Portuguesa",
      descripcion: "Ampliación del IUTEPI en Guanare, Estado Portuguesa.",
      carreras: ["Administración Industrial"]
    }
  ],
  carreras: [
    {
      id: "analisis-sistemas",
      nombre: "Análisis de Sistemas",
      sigla: "TSU en Análisis de Sistemas",
      duracion: "6 semestres (3 años)",
      titulo: "Técnico Superior Universitario en Análisis de Sistemas",
      descripcion: "Profesional con amplios conocimientos en el desarrollo, manejo y diseño de programas y paquetes de aplicaciones informáticas, necesarios en la gestión eficiente de sistemas computacionales.",
      perfil_egresado: [
        "Desarrollar a nivel lógico cualquier programa científico-administrativo",
        "Manejar paquetes de aplicaciones como nómina, inventario, hojas de cálculo",
        "Analizar, diseñar y programar sistemas de computación",
        "Analizar, evaluar e implementar sistemas operativos y aplicaciones",
        "Preparar estudios comparativos de Hardware y Software",
        "Diseñar y administrar redes de datos e infraestructura tecnológica",
        "Desarrollar aplicaciones web con múltiples lenguajes y frameworks"
      ],
      menciones: [
        {
          nombre: "Gestión de Redes",
          descripcion: "Diseña y administra conocimientos y herramientas tecnológicas para configurar redes que se constituyen en soporte de los sistemas de información y comunicación, en el manejo de datos para diversos entornos informáticos."
        },
        {
          nombre: "Desarrollo Web",
          descripcion: "Diseña y desarrolla aplicaciones WEB a través de múltiples lenguajes, herramientas y soportes tecnológicos para la gestión estratégica de diversos espacios interactivos del mundo informático."
        }
      ],
      pensum: [
        { semestre: 1, nombre: "Primer Semestre", materias: ["Matemática I", "Inglés Técnico I", "Lenguajes de Programación I", "Introducción a la Computación", "Sistemas Operativos I", "Comunicación y Lenguaje"] },
        { semestre: 2, nombre: "Segundo Semestre", materias: ["Matemática II", "Inglés Técnico II", "Lenguajes de Programación II", "Base de Datos I", "Sistemas Operativos II", "Metodología de la Investigación"] },
        { semestre: 3, nombre: "Tercer Semestre", materias: ["Matemática III", "Lenguajes de Programación III", "Base de Datos II", "Redes de Datos I", "Ingeniería de Software I", "Seguridad Informática"] },
        { semestre: 4, nombre: "Cuarto Semestre", materias: ["Base de Datos III", "Redes de Datos II", "Ingeniería de Software II", "Administración de Sistemas", "Electiva I", "Pasantías Fase I"] },
        { semestre: 5, nombre: "Quinto Semestre", materias: ["Proyecto de Investigación Tecnológica", "Electiva II", "Seminario de Grado"] },
        { semestre: 6, nombre: "Sexto Semestre", materias: ["Proyecto de Grado", "Pasantías Fase II"] }
      ],
      pensum_url: "assets/pdfs/pensum-sistemas.pdf",
      campo_laboral: ["Empresas de tecnología e informática", "Bancos e instituciones financieras", "Organismos públicos y privados", "Desarrollo web independiente"],
      icono: "fa-laptop-code",
      color: "#CC1F26"
    },
    {
      id: "electronica",
      nombre: "Electrónica",
      sigla: "TSU en Electrónica",
      duracion: "6 semestres (3 años)",
      titulo: "Técnico Superior Universitario en Electrónica",
      descripcion: "Profesional formado en el análisis y diseño, tanto de diversos circuitos electrónicos digitales, como de variados procesos eléctricos.",
      perfil_egresado: [
        "Diseñar y analizar circuitos electrónicos analógicos y digitales",
        "Programar y desarrollar esquemas de control automático",
        "Diseñar y fabricar circuitos impresos (PCB)",
        "Realizar instalaciones y canalizaciones eléctricas",
        "Mantener y reparar equipos electrónicos e industriales",
        "Manejar microprocesadores y microcontroladores"
      ],
      menciones: [
        { nombre: "Canalizaciones Eléctricas", descripcion: "Diseña canalizaciones eléctricas, desde rigurosos procesos de instalación y protección." },
        { nombre: "Automatización", descripcion: "Programa y desarrolla esquemas eléctricos para el diseño e implementación de circuitos de control automático." },
        { nombre: "PCB (Placa de Circuito Impreso)", descripcion: "Diseña y fabrica circuitos impresos en tarjetas electrónicas a través del esquemático eléctrico-digital." }
      ],
      pensum: [
        { semestre: 1, nombre: "Primer Semestre", materias: ["Física I", "Matemática I", "Electrónica Básica", "Inglés Técnico I", "Dibujo Técnico", "Comunicación y Lenguaje"] },
        { semestre: 2, nombre: "Segundo Semestre", materias: ["Física II", "Matemática II", "Electrónica Analógica", "Inglés Técnico II", "Circuitos Eléctricos", "Metodología de la Investigación"] },
        { semestre: 3, nombre: "Tercer Semestre", materias: ["Matemática III", "Electrónica Digital", "Microprocesadores", "Instrumentación Industrial", "Señales y Sistemas", "Programación de Microcontroladores"] },
        { semestre: 4, nombre: "Cuarto Semestre", materias: ["Automatización Industrial", "Control Industrial", "Diseño de PCB", "Mantenimiento de Equipos Electrónicos", "Electiva I", "Pasantías Fase I"] },
        { semestre: 5, nombre: "Quinto Semestre", materias: ["Proyecto de Investigación Tecnológica", "Electiva II", "Seminario de Grado"] },
        { semestre: 6, nombre: "Sexto Semestre", materias: ["Proyecto de Grado", "Pasantías Fase II"] }
      ],
      pensum_url: "assets/pdfs/pensum-electronica.pdf",
      campo_laboral: ["Industrias manufactureras y eléctricas", "Empresas de telecomunicaciones", "Plantas industriales", "Talleres de reparación electrónica"],
      icono: "fa-microchip",
      color: "#1A62CC"
    },
    {
      id: "administracion-industrial",
      nombre: "Administración Industrial",
      sigla: "TSU en Administración Industrial",
      duracion: "6 semestres (3 años)",
      titulo: "Técnico Superior Universitario en Administración Industrial",
      descripcion: "Profesional formado desde fundamentos sólidos e innovadores en administración contable, financiera y operativa de la industria, el comercio y la prestación de servicios.",
      perfil_egresado: [
        "Participar en la administración contable, financiera y operativa empresarial",
        "Diseñar, ejecutar y evaluar actividades productivas",
        "Manejar criterios y componentes de estados financieros",
        "Dominar los fundamentos tributarios",
        "Gestionar políticas bancarias y aseguradoras",
        "Liderar procesos de administración de negocios"
      ],
      menciones: [
        { nombre: "Contaduría", descripcion: "Maneja los criterios y componentes que constituyen el escrutinio profundo de los estados de situación financiera." },
        { nombre: "Tributo", descripcion: "Domina los fundamentos del impuesto en sus múltiples dimensiones de aplicación para la gestión de políticas tributarias." },
        { nombre: "Banca, Seguros y Negocios", descripcion: "Maneja los ámbitos administrativos y jurídicos para el conocimiento, aplicación y gestión de políticas bancarias y aseguradoras." }
      ],
      pensum: [
        { semestre: 1, nombre: "Primer Semestre", materias: ["Matemática I", "Inglés Técnico I", "Contabilidad I", "Economía General", "Comunicación y Lenguaje", "Introducción a la Administración"] },
        { semestre: 2, nombre: "Segundo Semestre", materias: ["Matemática II", "Inglés Técnico II", "Contabilidad II", "Derecho Mercantil", "Estadística Aplicada", "Metodología de la Investigación"] },
        { semestre: 3, nombre: "Tercer Semestre", materias: ["Matemática Financiera", "Contabilidad de Costos", "Administración de Empresas I", "Finanzas Empresariales", "Tributación", "Relaciones Industriales"] },
        { semestre: 4, nombre: "Cuarto Semestre", materias: ["Administración de Empresas II", "Análisis Financiero", "Seguridad Industrial", "Mercadeo y Ventas", "Electiva I", "Pasantías Fase I"] },
        { semestre: 5, nombre: "Quinto Semestre", materias: ["Proyecto de Investigación", "Electiva II", "Seminario de Grado"] },
        { semestre: 6, nombre: "Sexto Semestre", materias: ["Proyecto de Grado", "Pasantías Fase II"] }
      ],
      pensum_url: "assets/pdfs/pensum-administracion.pdf",
      campo_laboral: ["Empresas industriales y comerciales", "Instituciones bancarias y aseguradoras", "Despachos contables", "Organismos públicos"],
      icono: "fa-chart-line",
      color: "#E8B84B"
    }
  ],
   metodos: [
    {
      nombre: "Presencial",
      descripcion: "Clases en aulas físicas de lunes a viernes. La modalidad tradicional con interacción directa docente-estudiante.",
      horarios: "Mañana: 7:00am - 12:00pm | Tarde: 12:00pm - 6:00pm",
      icono: "fa-school"
    },
    {
      nombre: "Semipresencial",
      descripcion: "Combinación de clases presenciales y en línea. Los estudiantes asisten a la institución algunos días y complementan el resto vía plataforma virtual.",
      horarios: "Sábados presenciales + actividades virtuales entre semana",
      icono: "fa-laptop"
    },
    {
      nombre: "A Distancia / Virtual",
      descripcion: "Estudios completamente en línea a través de la plataforma Moodle del IUTEPI.",
      horarios: "Flexible - acceso a la plataforma virtual",
      icono: "fa-globe"
    }
  ],
  diplomados: [
    { nombre: "Diplomado en Seguridad Informática", duracion: "6 meses", modalidad: "Semipresencial" },
    { nombre: "Diplomado en Automatización Industrial", duracion: "6 meses", modalidad: "Presencial" },
    { nombre: "Diplomado en Administración Contable y Tributaria", duracion: "4 meses", modalidad: "Semipresencial" },
    { nombre: "Diplomado en Redes y Comunicaciones", duracion: "5 meses", modalidad: "Virtual" }
  ],
  faqs: [
    { pregunta: "¿Cuánto duran las carreras?", respuesta: "Todas las carreras del IUTEPI tienen una duración de 6 semestres, equivalentes a 3 años de estudio." },
    { pregunta: "¿Qué título otorga el IUTEPI?", respuesta: "El IUTEPI otorga el título de Técnico Superior Universitario (TSU)." },
    { pregunta: "¿Tiene modalidad virtual o a distancia?", respuesta: "Sí, el IUTEPI ofrece tres modalidades: presencial, semipresencial y a distancia/virtual a través de su plataforma Moodle." },
    { pregunta: "¿Cuáles son los requisitos para inscribirse?", respuesta: "Necesitas: cédula de identidad, título de bachiller o constancia de culminación de estudios, notas certificadas y 4 fotos tipo carnet. El proceso se realiza en línea y de forma presencial." },
    { pregunta: "¿Cuántas sedes tiene el IUTEPI?", respuesta: "El IUTEPI tiene su sede principal en Valencia (Carabobo) y extensiones en Acarigua (Portuguesa) y Guanare (Portuguesa)." },
    { pregunta: "¿El IUTEPI tiene aula virtual?", respuesta: "Sí, el IUTEPI cuenta con un aula virtual basada en Moodle." }
  ]
};
const CHATBOT_SYSTEM_PROMPT = `Eres PIA (Plataforma de Información Académica), el asistente oficial del IUTEPI (Instituto Universitario de Tecnología para la Informática).
Tu rol es orientar, informar y ayudar de forma profesional, clara y precisa a:
- Estudiantes actuales del IUTEPI
- Personas interesadas en inscribirse
INFORMACION COMPLETA DEL IUTEPI:
${JSON.stringify(IUTEPI_DATA, null, 2)}
REGLAS DE COMPORTAMIENTO:
1. Responde de forma profesional, formal pero amigable. No uses un tono extremadamente robotico.
2. Sé específico: menciona los semestres y materias exactas requeridas si alguien pregunta.
3. No uses emojis de forma excesiva. Simplemente comunica la información en texto plano y claro.
4. Si preguntan algo que no tienes información exacta, sé honesto y sugiere que contacten directamente a la institución mediante el correo iutepi@iutepi.edu.
5. Mantén las respuestas concisas pero completas. Sin párrafos enormes, utiliza listas.
6. Si alguien pregunta sobre inscripción, guíalos paso a paso con los requisitos.
7. Las ubicaciones que existen son Valencia (Carabobo), Acarigua (Portuguesa) y Guanare (Portuguesa). No digas que hay sede en Ejido o Mérida porque no existen.
EJEMPLOS DE RESPUESTAS BIEN FORMATEADAS:
- Para listas: usa guiones o viñetas simples
- Para enfatizar: usa MAYUSCULAS breves o negritas`;
if (typeof window !== 'undefined') {
  window.IUTEPI_DATA = IUTEPI_DATA;
  window.CHATBOT_SYSTEM_PROMPT = CHATBOT_SYSTEM_PROMPT;
}
if (typeof module !== 'undefined') {
  module.exports = { IUTEPI_DATA, CHATBOT_SYSTEM_PROMPT };
}
