import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Descarga MUBER | Inscripción de choferes',
  description: 'Descarga MUBER y completa tu inscripción como chofer desde la aplicación.',
};

const apkDownloadUrl = 'https://d18larf2bvzqi8.cloudfront.net/public/landings/downloads/muber-piloto-controlado-real-b6f66f94.apk';

const installScreens = [
  {
    number: '01',
    title: 'Presiona Instalar',
    image: '/install-step-02-install.png',
    alt: 'Pantalla de Android para instalar MUBER',
    marker: 'tap-install',
    crop: 'crop-install',
  },
  {
    number: '02',
    title: 'Espera la instalación',
    image: '/install-step-03-progress.png',
    alt: 'Progreso de instalación de MUBER',
    marker: '',
    crop: 'crop-progress',
  },
  {
    number: '03',
    title: 'Abre Más detalles',
    image: '/install-step-04-details.png',
    alt: 'Aviso de Google Play Protect con la opción Más detalles',
    marker: 'tap-details',
    crop: 'crop-details',
  },
  {
    number: '04',
    title: 'Confirma la instalación',
    image: '/install-step-05-confirm.png',
    alt: 'Opción para confirmar la instalación de MUBER',
    marker: 'tap-confirm',
    crop: 'crop-confirm',
  },
];

const driverFormScreens = [
  ['01', 'Datos personales', '/driver-form-step-01.png'],
  ['02', 'Vehículo', '/driver-form-step-02.png'],
  ['03', 'Documentos', '/driver-form-step-03.png'],
  ['04', 'Cobertura y disponibilidad', '/driver-form-step-04.png'],
  ['05', 'Método de pago', '/driver-form-step-05.png'],
  ['06', 'Datos bancarios', '/driver-form-step-06.png'],
  ['07', 'Resumen y envío', '/driver-form-step-07.png'],
  ['08', 'Estado de postulación', '/driver-form-step-08.png'],
];

export default function DownloadPage() {
  return (
    <main className="download-page">
      <header className="download-header">
        <a className="brand" href="/choferes/" aria-label="MUBER, volver a la página de choferes">
          <img src="/muber-logo-tight.png" width="438" height="102" alt="MUBER — tus traslados, sin estrés" />
        </a>
        <a className="download-back" href="/choferes/">Volver</a>
      </header>

      <section className="download-hero">
        <div className="download-copy">
          <span className="eyebrow light"><i /> Aplicación para choferes</span>
          <h1>Descarga <em>MUBER</em> y <span>comienza</span> tu inscripción.</h1>
          <p>Instala la aplicación en tu teléfono y sigue los pasos para enviar tu postulación como chofer MUBER.</p>
          <div className="download-action">
            <a className="button button-primary download-button" href={apkDownloadUrl} aria-describedby="download-status">
              Descargar MUBER
            </a>
            <span id="download-status">Archivo APK para dispositivos Android.</span>
          </div>
          <div className="download-trust" aria-label="Información de la descarga">
            <span>✓ Descarga directa</span>
            <span>✓ Instrucciones paso a paso</span>
            <span>✓ Inscripción desde la app</span>
          </div>
        </div>

        <div className="install-preview-grid" aria-label="Instrucciones visuales para instalar MUBER">
          {installScreens.map((screen) => (
            <figure className={`install-screen ${screen.crop}`} key={screen.number}>
              <div className="install-screen-image">
                <img src={screen.image} alt={screen.alt} />
                {screen.marker && <span className={`tap-marker ${screen.marker}`} aria-hidden="true">☝</span>}
              </div>
              <figcaption><span>{screen.number}</span><strong>{screen.title}</strong></figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="download-instructions" aria-labelledby="instruction-title">
        <div className="download-section-heading">
          <span className="eyebrow"><i /> Solo un paso más</span>
          <h2 id="instruction-title">Completa la inscripción y sé parte de <em>MUBER</em>.</h2>
          <p>El proceso se realiza desde tu teléfono. Ten a mano tus datos y documentos para completar la inscripción.</p>
        </div>

        <div className="driver-form-grid" aria-label="Pasos del formulario de inscripción de choferes">
          {driverFormScreens.map(([number, title, image]) => (
            <figure className="driver-form-screen" key={number}>
              <img src={image} alt={`Paso ${number}: ${title}`} />
              <figcaption><span>{number}</span><strong>{title}</strong></figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="download-help">
        <div>
          <span className="eyebrow light"><i /> Inscripción de choferes</span>
          <h2>Todo comienza en la app.</h2>
          <p>Después de instalar MUBER, abre la aplicación y completa el formulario de inscripción.</p>
        </div>
        <a className="button button-gold" href={apkDownloadUrl}>Descargar aplicación</a>
      </section>

      <footer>
        <img src="/muber-logo.png" alt="MUBER" />
        <div className="community-links"><p>Fletes y traslados sin estrés.</p><a href="mailto:contacto@muber.cl?subject=Quiero%20ser%20parte%20de%20la%20comunidad%20MUBER">Comunidad MUBER</a></div>
        <span>© 2026 MUBER · Región de Valparaíso</span>
      </footer>
    </main>
  );
}

