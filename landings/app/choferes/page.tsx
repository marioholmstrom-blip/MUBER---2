const benefits = [
  ['01', 'Tú eliges cuándo conducir', 'Actívate cuando estés disponible y recibe solicitudes de fletes en tu zona.'],
  ['02', 'Más oportunidades para tu vehículo', 'Conecta con personas y empresas que necesitan mover carga de forma simple.'],
  ['03', 'Información clara antes de aceptar', 'Revisa origen, destino, carga y valor del servicio antes de tomar una solicitud.'],
];

const steps = [
  ['Completa tu postulación', 'Ingresa tus datos, vehículo, cobertura y documentos.'],
  ['Revisión MUBER', 'Nuestro equipo revisa la información enviada de forma segura.'],
  ['Activa tu disponibilidad', 'Una vez aprobado, podrás conectarte y comenzar a recibir solicitudes.'],
];

const requirements = [
  'Licencia de conducir vigente',
  'Vehículo con documentación al día',
  'Teléfono con conexión a internet',
  'Disponibilidad para operar en tu zona',
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="MUBER, ir al inicio">
          <img src="/muber-logo-tight.png" width="438" height="102" alt="MUBER — tus traslados, sin estrés" />
        </a>
        <nav aria-label="Navegación principal">
          <a href="#beneficios">Beneficios</a>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#requisitos">Requisitos</a>
        </nav>
        <a className="button button-small" href="/descargar">Quiero ser chofer</a>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <span className="eyebrow"><i /> Conductores <strong>MUBER</strong></span>
          <h1>Tu vehículo puede llevarte <em>más lejos.</em></h1>
          <p>Súmate a MUBER y conecta con personas y empresas que necesitan mover sus cargas de forma confiable en la Región de Valparaíso.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="/descargar">Comenzar mi inscripción</a>
            <a className="text-link" href="#como-funciona">Conoce cómo funciona <span>↓</span></a>
          </div>
          <div className="trust-row" aria-label="Características del proceso">
            <span>✓ Postulación digital</span><span>✓ Revisión segura</span><span>✓ Tú manejas tus tiempos</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Vista del panel operativo MUBER">
          <div className="route-line route-line-one" /><div className="route-line route-line-two" />
          <div className="app-shot-frame">
            <img className="app-shot" src="/muber-driver-panel-current.png" alt="Panel operativo real de MUBER para choferes" />
          </div>
          <div className="floating-badge badge-two"><span>★</span> Tú decides cuándo</div>
        </div>
      </section>

      <section className="benefits section" id="beneficios">
        <div className="section-heading">
          <span className="eyebrow"><i /> Crece con MUBER</span>
          <h2>Más control. Más oportunidades.<br /><em>Menos estrés.</em></h2>
        </div>
        <div className="benefit-grid">
          {benefits.map(([number, title, copy]) => (
            <article className="benefit-card" key={number}>
              <div className="benefit-card-heading"><span className="card-number">{number}</span><h3>{title}</h3></div>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="how section" id="como-funciona">
        <div className="how-copy">
          <span className="eyebrow light"><i /> Un proceso simple</span>
          <h2>Comienza en tres pasos.</h2>
          <p>Diseñamos una inscripción clara para que puedas concentrarte en lo importante: conducir.</p>
        </div>
        <ol className="step-list">
          {steps.map(([title, copy], index) => (
            <li key={title}><span>{index + 1}</span><div><h3>{title}</h3><p>{copy}</p></div></li>
          ))}
        </ol>
      </section>

      <section className="requirements section" id="requisitos">
        <div className="requirements-panel">
          <span className="eyebrow"><i /> Antes de comenzar</span>
          <h2>Ten estos datos a mano.</h2>
          <p>La postulación se completa en línea y puedes preparar tus documentos con anticipación.</p>
          <ul>{requirements.map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul>
        </div>
        <aside className="security-panel">
          <div className="security-top">
            <span className="shield">M</span>
            <div className="security-brands" aria-label="Microsoft Azure y Azure Key Vault">
              <span><img src="/microsoft-logo.svg" alt="Microsoft" />Microsoft Azure</span>
              <span><img src="/azure-key-vault.svg" alt="Azure Key Vault" />Azure Key Vault</span>
            </div>
          </div>
          <h3>Tu información se revisa de forma segura</h3>
          <p>Los datos de la postulación se utilizan únicamente para validar tu incorporación como chofer MUBER.</p>
          <p>La información se protege con servicios de Microsoft Azure y Azure Key Vault.</p>
        </aside>
      </section>

      <section className="final-cta" id="postular">
        <div><span className="eyebrow light"><i /> Inscripción de choferes</span><h2>¿Listo para moverte<br />con MUBER?</h2><p>Completa tu postulación y da el primer paso para conducir con nosotros.</p></div>
        <a className="button button-gold" href="/descargar">Iniciar inscripción</a>
      </section>

      <footer><img src="/muber-logo.png" alt="MUBER" /><div className="community-links"><p>Fletes y traslados sin estrés.</p><a href="mailto:contacto@muber.cl?subject=Quiero%20ser%20parte%20de%20la%20comunidad%20MUBER">Comunidad MUBER</a></div><span>© 2026 MUBER · Región de Valparaíso</span></footer>
    </main>
  );
}

