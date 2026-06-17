import { Bullet, LegalDocLayout, Notice, Section, SubSection } from './LegalDocParts';

const TermsConditionsView = ({ onBack }: { onBack: () => void }) => (
  <LegalDocLayout
    title="Términos y Condiciones"
    onBack={onBack}
    intro={
      <>
        Bienvenidos a Do.Events. Estos términos y condiciones describen las reglas y regulaciones para el
        uso de la aplicación móvil y/o web Do.Events, desarrollada por Do.Events Software SAS, con NIT
        901908812-0, con domicilio en Carrera 91 No. 20A-75, Bogotá D.C., Colombia. Al acceder a la
        aplicación móvil o web, asumes que aceptas estos términos y condiciones en su totalidad. No
        continuar si no estás de acuerdo con todos los términos aquí establecidos.
      </>
    }
  >
    <Section title="1. Definiciones">
      <Bullet><strong>"Eventer":</strong> persona o empresa que organiza y es dueña de eventos publicados en Do.Events.</Bullet>
      <Bullet><strong>"Invitado":</strong> persona que recibe una invitación a un evento.</Bullet>
      <Bullet><strong>"Asistente":</strong> persona que confirmó asistencia o compró un boleto.</Bullet>
      <Bullet><strong>"Host":</strong> dueño de un lugar para realizar eventos.</Bullet>
      <Bullet><strong>"Staff":</strong> persona o empresa que brinda servicios logísticos para eventos.</Bullet>
      <Bullet><strong>"Cliente":</strong> persona o empresa que busca un Eventer para organizar su evento.</Bullet>
      <Bullet><strong>"TOS":</strong> estos Términos y Condiciones.</Bullet>
    </Section>

    <Section title="2. Descripción de la Plataforma">
      <p>
        Do.Events es una plataforma tecnológica móvil y web (iOS, Android) que permite gestionar eventos
        de principio a fin: crear, publicar, vender, comunicar, contratar servicios, gestionar invitados,
        control de accesos y estadísticas, en un entorno de red social.
      </p>
    </Section>

    <Section title="3. Uso de la Plataforma">
      <p>Al utilizar Do.Events, aceptas:</p>
      <Bullet>No publicar contenido ofensivo, ilegal, difamatorio o engañoso.</Bullet>
      <Bullet>Respetar los derechos y la privacidad de otros usuarios.</Bullet>
      <Bullet>No intentar acceder a cuentas de otros usuarios sin autorización.</Bullet>
      <Bullet>No acosar, amenazar o discriminar a otros usuarios.</Bullet>
    </Section>

    <Section title="4. Obligaciones del Eventer">
      <p>
        El Eventer es responsable del evento anunciado, sus características, regularidad, información
        publicada y ejecución. Declara que el precio informado es el final e incluye todas las cargas
        adicionales. Los eventos deben estar en plena regularidad conforme a la ley colombiana.
      </p>
    </Section>

    <Section title="5. Obligaciones del Invitado y/o Cliente">
      <p>
        Al manifestar interés en un evento, el usuario se compromete a verificar las condiciones del mismo
        (fecha, hora, lugar, costos) antes de su adquisición.
      </p>
      <Notice title="Protección del Asistente">
        La opción por defecto en todo proceso de compra es la Compra Protegida (escrow). La Transferencia
        Inmediata al Organizador requiere una elección explícita e informada del Asistente y solo está
        disponible con Organizadores de Nivel 2 o superior.
      </Notice>
    </Section>

    <Section title="6. Registro, Edad Mínima y Verificación de Identidad">
      <p>Para registrarse como Eventer y activar la venta de boletas, el usuario debe:</p>
      <Bullet>Ser mayor de 18 años o la mayoría de edad legal de su jurisdicción.</Bullet>
      <Bullet>Proporcionar información real, precisa y actualizada en el formulario de registro.</Bullet>
      <p>
        La verificación de identidad (KYC) NO es un requisito obligatorio para publicar eventos. Los
        Organizadores nuevos sin historial están cubiertos por el sistema de escrow y niveles progresivos:
        los fondos solo se liberan al Organizador después de la finalización verificada del evento.
      </p>
      <p>
        No obstante, Do.Events podrá requerir el proceso KYC en casos específicos (eventos de gran escala,
        alertas de fraude) y los Organizadores podrán solicitarlo voluntariamente para obtener el sello
        ORGANIZADOR CERTIFICADO.
      </p>
      <Notice title="Sello ORGANIZADOR CERTIFICADO">
        Los Organizadores que completen el proceso KYC voluntariamente (o cuando Do.Events lo requiera)
        recibirán el sello ORGANIZADOR CERTIFICADO en su perfil público. Este sello acredita que Do.Events
        verificó su identidad como persona natural o empresa. El sello no garantiza la realización del
        evento ni implica responsabilidad adicional de Do.Events. La certificación tiene un costo de USD
        $10 a USD $15 pagaderos por el Organizador, no reembolsables independientemente del resultado del
        proceso.
      </Notice>
      <p>
        Do.Events se reserva el derecho de suspender o cancelar cuentas con información falsa o
        incompleta.
      </p>
    </Section>

    <Section title="7. Recaudo, Escrow y Límites Progresivos">
      <p>
        Todos los pagos de boletas son procesados a través de Wompi, pasarela de pagos certificada.
        Do.Events opera bajo un sistema de niveles progresivos para la liberación de fondos a los
        Organizadores. En resumen:
      </p>
      <Bullet>
        <strong>Organizadores Nuevos (Nivel 1):</strong> los fondos se liberan únicamente después de la
        finalización verificada del evento. La Modalidad de Transferencia Inmediata no está disponible.
      </Bullet>
      <Bullet>
        <strong>Organizadores en Desarrollo (Nivel 2):</strong> condiciones intermedias según historial.
      </Bullet>
      <Bullet>
        <strong>Organizadores Verificados (Nivel 3):</strong> posibilidad de adelanto parcial y Modalidad
        de Transferencia Inmediata disponible.
      </Bullet>
      <Notice title="Nota legal">
        Do.Events es una plataforma colombiana. Las reclamaciones de derechos de autor se tramitan
        conforme a la legislación colombiana (Ley 23/1982) y la Decisión Andina 351/1993. No aplica la
        Digital Millennium Copyright Act (DMCA) de EE.UU.
      </Notice>
    </Section>

    <Section title="8. Depósito de Garantía">
      <p>
        Do.Events podrá exigir a los Organizadores un depósito de garantía en eventos de gran escala, alto
        valor o cuando el Organizador sea nuevo en la plataforma. Ver detalle en la Política de Recaudos y
        Reembolsos.
      </p>
    </Section>

    <Section title="9. Contenido Prohibido">
      <p>No se permite publicar ni solicitar:</p>
      <Bullet>Contenido pornográfico, desnudos explícitos o que involucren menores de edad.</Bullet>
      <Bullet>Contenidos que inciten al odio, violencia o discriminación.</Bullet>
      <Bullet>Eventos relacionados con organizaciones terroristas o paramilitares.</Bullet>
      <Bullet>Contenidos que fomenten la comisión de crímenes o autolesiones.</Bullet>
      <Bullet>Contenidos que reproduzcan eventos sensibles con ánimo de lucro.</Bullet>
    </Section>

    <Section title="10. Derechos de Autor">
      <p>
        Si consideras que algún contenido publicado en Do.Events infringe tus derechos de autor, puedes
        notificarlo a management@doeventsapp.com. El proceso de reclamación se rige por la Ley 23 de 1982
        y la Decisión Andina 351 de 1993, normas aplicables en Colombia y la región andina.
      </p>
      <Notice title="Derechos del Consumidor">
        Sin perjuicio de la cláusula de arbitraje, los Asistentes y Consumidores finales conservan en todo
        momento el derecho de acudir a la Superintendencia de Industria y Comercio (SIC) o a los jueces
        ordinarios para la protección de sus derechos, conforme a los artículos 58 y concordantes de la
        Ley 1480 de 2011.
      </Notice>
    </Section>

    <Section title="11. Privacidad de los Datos">
      <p>
        Do.Events trata los datos personales de sus usuarios conforme a la Ley 1581 de 2012 y el Decreto
        1377 de 2013. Consulta nuestra Política de Privacidad para más información. Do.Events tiene
        inscritas sus bases de datos ante el Registro Nacional de Bases de Datos (RNBD) de la
        Superintendencia de Industria y Comercio (SIC).
      </p>
    </Section>

    <Section title="12. Responsabilidades">
      <SubSection title="12.1 Responsabilidad de Do.Events">
        <p>
          Do.Events será responsable por defectos en la prestación de sus servicios tecnológicos en la
          medida en que le sean imputables y con el alcance previsto en las leyes vigentes.
        </p>
      </SubSection>
      <SubSection title="12.2 Responsabilidad del Eventer">
        <p>
          El Eventer responde por el contenido de su oferta, la veracidad de la información publicada, la
          calidad del evento y el cumplimiento de sus obligaciones frente a los Asistentes, incluyendo
          los reembolsos bajo la Modalidad de Transferencia Inmediata.
        </p>
      </SubSection>
      <SubSection title="12.3 Responsabilidad solidaria">
        <p>
          Conforme al artículo 53 de la Ley 1480 de 2011, Do.Events podrá ser considerada solidariamente
          responsable en casos de daño directo a los Asistentes derivado de fraude comprobado del
          Organizador, aún en la Modalidad de Transferencia Inmediata.
        </p>
      </SubSection>
    </Section>

    <Section title="13. Tarifas">
      <p>
        Do.Events podrá cobrar por sus servicios y el usuario se compromete a pagarlos oportunamente. Las
        tarifas actualizadas están disponibles en www.doeventsapp.com. Do.Events podrá retener o debitar
        fondos de la cuenta del Organizador para saldar tarifas impagas o deudas derivadas de
        incumplimientos.
      </p>
    </Section>

    <Section title="14. Resolución de Controversias">
      <p>
        Toda controversia derivada de estos Términos y Condiciones será resuelta en primera instancia
        mediante arbitraje vinculante conforme a las normas comerciales de Colombia, con sede en Bogotá,
        D.C.
      </p>
    </Section>

    <Section title="15. Sanciones">
      <p>
        El incumplimiento de estos Términos y Condiciones podrá resultar en advertencia, suspensión
        temporal o inhabilitación definitiva de la cuenta, sin perjuicio de las acciones legales que
        correspondan.
      </p>
    </Section>

    <Section title="16. Disposiciones Generales">
      <p>
        Estos Términos y Condiciones se rigen por la ley colombiana. Cualquier modificación será publicada
        en www.doeventsapp.com con previo aviso. El uso continuado de los servicios después de publicada
        una modificación implica su aceptación.
      </p>
      <p>Contacto: management@doeventsapp.com</p>
    </Section>
  </LegalDocLayout>
);

export default TermsConditionsView;
