/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from 'next';
import styles from './usuarios.module.css';

export const metadata: Metadata = {
  title: 'MUBER | Fletes y traslados sin estrés',
  description:
    'Solicita fletes, carga, última milla y mudanzas asistidas en Valparaíso, Viña del Mar, Concón y Quilpué.',
};

const services = [
  {
    number: '01',
    title: 'Flete estándar',
    copy: 'Para muebles, compras grandes y cargas que necesitan más espacio.',
    label: 'Muebles y carga',
  },
  {
    number: '02',
    title: 'Última milla',
    copy: 'Entregas locales para personas, comercios y emprendimientos.',
    label: 'Entregas locales',
  },
  {
    number: '03',
    title: 'Mudanza asistida',
    copy: 'Traslada tus cosas con apoyo durante la carga y descarga.',
    label: 'Apoyo adicional',
  },
];

const steps = [
  ['Elige origen y destino', 'Indica dónde retiramos y dónde entregamos tu carga.'],
  ['Elige lo que necesitas', 'Selecciona el servicio y describe tu carga.'],
  ['Revisa el precio', 'Conoce el valor del traslado antes de confirmar.'],
  ['Sigue tu solicitud', 'Mantén el control desde el inicio hasta la entrega.'],
];

export default function UsuariosPage() {
  const apkDownloadUrl =
    'https://d18larf2bvzqi8.cloudfront.net/public/landings/downloads/muber-piloto-controlado-real-b6f66f94.apk';

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.logo} href="#inicio" aria-label="MUBER, ir al inicio">
          <img src="/muber-logo-tight.png" width="438" height="102" alt="MUBER, tus traslados sin estrés" />
        </a>
        <nav className={styles.nav} aria-label="Navegación principal">
          <a href="#servicios">Servicios</a>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#cobertura">Cobertura</a>
        </nav>
        <a className={`${styles.button} ${styles.headerButton}`} href="/usuarios/como-funciona">
          Conoce cómo funciona
        </a>
      </header>

      <section className={styles.hero} id="inicio">
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}><i /> Fletes y mudanzas en Valparaíso</span>
          <h1>
            Mueve lo que necesitas. <em>Sin estrés.</em>
          </h1>
          <p>
            Pide tu flete, carga o servicio de última milla desde el teléfono, conoce el precio antes de confirmar y sigue cada paso con <strong>MUBER</strong>.
          </p>
          <div className={styles.heroActions}>
            <a className={`${styles.button} ${styles.primaryButton}`} href={apkDownloadUrl}>
              Quiero solicitar un flete
            </a>
            <a className={`${styles.button} ${styles.primaryButton}`} href="/choferes/">
              Quiero ser chofer
            </a>
          </div>
          <div className={styles.trustRow} aria-label="Beneficios principales">
            <span><b>✓</b> Precio transparente</span>
            <span><b>✓</b> Seguimiento en tiempo real</span>
            <span><b>✓</b> Conductores verificados</span>
          </div>
        </div>

        <div className={styles.heroVisual} aria-label="Aplicación MUBER para solicitar un flete y seguir su recorrido">
          <div className={styles.locationBadge}>
            <span aria-hidden="true">●</span>
            <div><small>Disponible en</small><strong>Valparaíso, Viña del Mar, Concón y Quilpué</strong></div>
          </div>
          <div className={styles.phoneStack}>
            <div className={`${styles.phoneFrame} ${styles.trackingPhone}`}>
              <img src="/muber-user-tracking.png" alt="Seguimiento real de un flete MUBER" />
            </div>
            <div className={`${styles.phoneFrame} ${styles.homePhone}`}>
              <img src="/muber-user-home.png" alt="Pantalla principal de servicios MUBER" />
            </div>
          </div>
          <div className={styles.priceBadge}><span>$</span> Precio antes de confirmar</div>
        </div>
      </section>

      <section className={styles.services} id="servicios" aria-labelledby="services-title">
        <div className={styles.sectionHeading}>
          <span className={styles.eyebrow}><i /> Un servicio para cada carga</span>
          <h2 id="services-title">¿Qué necesitas mover?</h2>
          <p>Elige la alternativa que mejor se ajusta a tu traslado.</p>
        </div>
        <div className={styles.serviceGrid}>
          {services.map((service) => (
            <article className={styles.serviceCard} key={service.number}>
              <div className={styles.serviceHeading}>
                <span>{service.number}</span>
                <div><h3>{service.title}</h3><small>{service.label}</small></div>
              </div>
              <p>{service.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.how} id="como-funciona" aria-labelledby="how-title">
        <div className={styles.howHeading}>
          <span className={`${styles.eyebrow} ${styles.light}`}><i /> Simple desde el teléfono</span>
          <h2 id="how-title">Tu flete en cuatro pasos.</h2>
          <p>Información clara para decidir antes de solicitar.</p>
        </div>
        <ol className={styles.stepList}>
          {steps.map(([title, copy], index) => (
            <li key={title}>
              <span>{index + 1}</span>
              <div><h3>{title}</h3><p>{copy}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.coverage} id="cobertura" aria-labelledby="coverage-title">
        <div className={styles.coverageCopy}>
          <span className={styles.eyebrow}><i /> Cobertura local</span>
          <h2 id="coverage-title">Conocemos cómo se mueve la región.</h2>
          <p>MUBER conecta solicitudes de carga en Valparaíso, Viña del Mar, Concón y Quilpué con una experiencia digital clara y cercana.</p>
          <div className={styles.areaList}><span>Valparaíso</span><span>Viña del Mar</span><span>Concón</span><span>Quilpué</span></div>
        </div>
        <div className={styles.promise}>
          <div className={styles.securityTop}>
            <span className={styles.promiseMark}>M</span>
            <div className={styles.securityBrands} aria-label="Microsoft Azure y Azure Key Vault">
              <span><img src="/microsoft-logo.svg" alt="Microsoft" />Microsoft Azure</span>
              <span><img src="/azure-key-vault.svg" alt="Azure Key Vault" />Azure Key Vault</span>
            </div>
          </div>
          <h3>Tu carga, bajo control.</h3>
          <p>La información de tu solicitud se usa únicamente para coordinar y gestionar tu traslado.</p>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <span className={`${styles.eyebrow} ${styles.light}`}><i /> MUBER para usuarios</span>
          <h2>Tu próximo traslado comienza aquí.</h2>
          <p>Cuéntanos qué necesitas mover y recibe orientación para comenzar.</p>
        </div>
        <div className={styles.finalActions}>
          <a className={`${styles.button} ${styles.goldButton}`} href={apkDownloadUrl}>Quiero solicitar un flete</a>
          <a className={`${styles.button} ${styles.finalDriverButton}`} href="/choferes/">Quiero ser chofer</a>
        </div>
      </section>

      <footer className={styles.footer}>
        <img src="/muber-logo.png" alt="MUBER" />
        <div className={styles.communityLinks}>
          <p>Fletes y traslados sin estrés.</p>
          <a href="mailto:contacto@muber.cl?subject=Quiero%20ser%20parte%20de%20la%20comunidad%20MUBER">Comunidad MUBER</a>
        </div>
        <a href="/">mubercargo.com</a>
      </footer>
    </main>
  );
}
