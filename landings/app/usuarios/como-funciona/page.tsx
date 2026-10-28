/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from 'next';
import styles from '../usuarios.module.css';

export const metadata: Metadata = {
  title: 'Cómo funciona MUBER | Solicita y sigue tu flete',
  description: 'Conoce cómo solicitar un flete y seguirlo desde la aplicación MUBER.',
};

const flow = [
  ['01', 'Define origen y destino', 'Indica el punto de retiro y el lugar de entrega.'],
  ['02', 'Elige tu servicio', 'Selecciona flete, carga, última milla o mudanza asistida.'],
  ['03', 'Confirma con información clara', 'Revisa los datos y el precio antes de solicitar.'],
  ['04', 'Sigue tu flete', 'Consulta el estado, el conductor asignado y el avance del recorrido.'],
];

export default function ComoFuncionaPage() {
  const apkDownloadUrl =
    'https://d18larf2bvzqi8.cloudfront.net/public/landings/downloads/muber-piloto-controlado-real-b6f66f94.apk';

  return (
    <main className={`${styles.page} ${styles.guidePage}`}>
      <header className={`${styles.header} ${styles.guideHeader}`}>
        <a className={styles.logo} href="/usuarios" aria-label="MUBER, volver a usuarios">
          <img src="/muber-logo-tight.png" width="438" height="102" alt="MUBER" />
        </a>
        <a className={`${styles.button} ${styles.headerButton}`} href="/usuarios">Volver</a>
      </header>

      <section className={styles.guideHero}>
        <div>
          <span className={`${styles.eyebrow} ${styles.light}`}><i /> MUBER para usuarios</span>
          <h1>Así funciona tu flete en <em>MUBER</em>.</h1>
          <p>Desde elegir el servicio hasta seguir al conductor, toda la información importante queda visible en tu teléfono.</p>
        </div>
        <video className={styles.guideVideo} controls preload="metadata" poster="/muber-user-home.png">
          <source src="https://d18larf2bvzqi8.cloudfront.net/public/landings/media/muber-como-funciona-20260915.mp4" type="video/mp4" />
          Tu navegador no puede reproducir este video.
        </video>
      </section>

      <section className={styles.guideFlow} aria-labelledby="guide-flow-title">
        <div className={styles.sectionHeading}>
          <span className={styles.eyebrow}><i /> Paso a paso</span>
          <h2 id="guide-flow-title">Simple, claro y desde el teléfono.</h2>
        </div>
        <div className={styles.guideGrid}>
          {flow.map(([number, title, copy]) => (
            <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>
          ))}
        </div>
      </section>

      <section className={styles.screenShowcase}>
        <figure><img src="/muber-user-home.png" alt="Selección de servicios MUBER" /><figcaption>Elige flete, carga, última milla o mudanza asistida.</figcaption></figure>
        <figure><img src="/muber-user-tracking.png" alt="Seguimiento de un flete MUBER" /><figcaption>Sigue el recorrido y consulta al conductor asignado.</figcaption></figure>
      </section>

      <section className={styles.finalCta}>
        <div><span className={`${styles.eyebrow} ${styles.light}`}><i /> Comienza con MUBER</span><h2>¿Qué necesitas mover?</h2><p>Solicita información para comenzar tu próximo flete.</p></div>
        <div className={styles.finalActions}>
          <a className={`${styles.button} ${styles.goldButton}`} href={apkDownloadUrl}>Quiero solicitar un flete</a>
          <a className={`${styles.button} ${styles.finalDriverButton}`} href="/choferes/">Quiero ser chofer</a>
        </div>
      </section>

      <footer className={styles.footer}>
        <img src="/muber-logo.png" alt="MUBER" />
        <div className={styles.communityLinks}><p>Fletes y traslados sin estrés.</p><a href="mailto:contacto@muber.cl?subject=Quiero%20ser%20parte%20de%20la%20comunidad%20MUBER">Comunidad MUBER</a></div>
        <a href="/">mubercargo.com</a>
      </footer>
    </main>
  );
}
