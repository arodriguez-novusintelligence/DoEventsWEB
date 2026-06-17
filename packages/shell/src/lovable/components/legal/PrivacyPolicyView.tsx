import { Bullet, LegalDocLayout, Notice, Section } from './LegalDocParts';

const PrivacyPolicyView = ({ onBack }: { onBack: () => void }) => (
  <LegalDocLayout
    title="Política de seguridad y privacidad"
    onBack={onBack}
    intro={
      <>
        Do.Events Software SAS, con NIT 901908812-0 y domicilio en Carrera 91 No. 20A-75, Bogotá D.C.,
        Colombia, es el Responsable del Tratamiento de los datos personales recopilados a través de su
        plataforma tecnológica móvil y web (iOS, Android).
      </>
    }
  >
    <Section title="1. Introducción y Marco Legal">
      <p>
        Do.Events es una plataforma diseñada para transformar la forma en que las personas se conectan a
        través de experiencias en vivo. Ofrece a emprendedores, influencers y empresas de eventos una
        única plataforma para gestionar el ciclo completo de sus eventos: crear, publicar, vender boletas,
        comunicarse, contratar servicios, gestionar invitados, controlar accesos y visualizar
        estadísticas, todo en un entorno de red social.
      </p>
      <p>La presente Política de Privacidad se rige por:</p>
      <Bullet>Ley 1581 de 2012 (Protección de Datos Personales de Colombia).</Bullet>
      <Bullet>Decreto 1377 de 2013.</Bullet>
      <Bullet>Circular Única de la Superintendencia de Industria y Comercio (SIC).</Bullet>
      <Notice title="Registro ante la SIC">
        Do.Events tiene inscritas sus bases de datos ante el Registro Nacional de Bases de Datos (RNBD)
        de la Superintendencia de Industria y Comercio, conforme al artículo 25 de la Ley 1581 de 2012.
      </Notice>
      <p>
        Responsable del Tratamiento: Do.Events Software SAS. Correo para ejercicio de derechos:
        privacy@doeventsapp.com
      </p>
    </Section>

    <Section title="2. Terminología">
      <Bullet><strong>"Eventer":</strong> persona o empresa que organiza y es dueña de eventos publicados en Do.Events.</Bullet>
      <Bullet><strong>"Invitado":</strong> persona que recibe una invitación a un evento.</Bullet>
      <Bullet><strong>"Asistente":</strong> persona que confirmó asistencia o compró un boleto.</Bullet>
      <Bullet><strong>"Host":</strong> persona dueña de un lugar para realizar eventos.</Bullet>
      <Bullet><strong>"Staff":</strong> persona o empresa que brinda servicios logísticos para eventos.</Bullet>
      <Bullet><strong>"Cliente":</strong> persona o empresa que busca un Eventer para organizar su evento.</Bullet>
      <Bullet><strong>"TOS":</strong> Términos y Condiciones de Do.Events.</Bullet>
    </Section>

    <Section title="3. Autorización para el Tratamiento de Datos">
      <p>
        Do.Events recopilará datos personales únicamente con la autorización previa, expresa e informada
        del titular, conforme al artículo 9 de la Ley 1581 de 2012. Esta autorización se obtiene mediante
        un formulario independiente presentado al usuario antes del inicio del tratamiento, y no se
        entiende otorgada por la simple aceptación de los Términos y Condiciones. El titular puede
        revocar su autorización en cualquier momento, sin efectos retroactivos, escribiendo a
        privacy@doeventsapp.com.
      </p>
    </Section>

    <Section title="4. Datos Personales que Recopilamos">
      <p><strong>4.1 Información recopilada de todos los usuarios:</strong></p>
      <Bullet>Nombre completo, dirección de correo electrónico y datos de contacto proporcionados voluntariamente.</Bullet>
      <Bullet>Contenido e interacciones en la plataforma (fotos, videos, publicaciones, "me gusta", búsquedas).</Bullet>
      <Bullet>Datos automáticos: dirección IP, tipo de dispositivo y navegador, comportamiento de navegación, cookies, etiquetas de píxel y tecnologías similares.</Bullet>

      <p><strong>4.2 Información adicional de Organizadores (Eventers):</strong></p>
      <Bullet>Información financiera: datos bancarios para transferencias, necesarios para facilitar el pago de recaudos.</Bullet>
      <Bullet>Información tributaria: NIT o cédula para efectos de retenciones ante la DIAN.</Bullet>
      <Bullet>Número de teléfono para verificación de cuenta.</Bullet>
      <Bullet>Cuando aplique el proceso KYC: documento de identidad y verificación facial (personas naturales) y adicionalmente Cámara de Comercio y RUT vigentes (personas jurídicas).</Bullet>

      <p><strong>4.3 Información de Asistentes (Consumidores):</strong></p>
      <Bullet>Datos financieros para compra de boletas, procesados exclusivamente por Wompi. Do.Events NO almacena datos de tarjetas de crédito o débito.</Bullet>
      <Bullet>Historial de compra de boletas y asistencia a eventos.</Bullet>
      <Bullet>Información adicional requerida por el Organizador en el proceso de registro al evento.</Bullet>

      <p><strong>4.4 Información de clientes potenciales:</strong></p>
      <Bullet>Nombre, correo electrónico, teléfono y otra información de contacto profesional recopilada por el equipo de ventas.</Bullet>
      <Bullet>Con consentimiento previo: grabaciones de audio o vídeo de reuniones comerciales.</Bullet>
    </Section>

    <Section title="5. Finalidades del Tratamiento">
      <Bullet>Registrar y autenticar cuentas de usuario.</Bullet>
      <Bullet>Procesar pagos y gestionar transacciones a través de Wompi.</Bullet>
      <Bullet>Ejecutar el proceso de verificación de identidad (KYC) cuando aplique.</Bullet>
      <Bullet>Personalizar la experiencia del usuario: contenido, recomendaciones y ofertas según preferencias.</Bullet>
      <Bullet>Enviar comunicaciones sobre actualizaciones, eventos, promociones y soporte al cliente.</Bullet>
      <Bullet>Publicidad y marketing propio y en nombre de Organizadores, incluyendo plataformas de redes sociales.</Bullet>
      <Bullet>Prevenir fraude, actividades no autorizadas y reforzar los Términos de Servicio.</Bullet>
      <Bullet>Cumplir obligaciones legales y tributarias ante la DIAN y demás autoridades colombianas.</Bullet>
      <Bullet>Generar estadísticas agregadas y anónimas para mejora del servicio.</Bullet>
    </Section>

    <Section title="6. Transferencias y Revelación de Datos">
      <p>Do.Events NO vende datos personales a terceros con fines publicitarios. Podrá compartirlos únicamente en los siguientes casos:</p>
      <Bullet>Proveedores de servicios tecnológicos (alojamiento, analytics, soporte, marketing) bajo contrato de confidencialidad.</Bullet>
      <Bullet>Pasarela de pagos Wompi, para el procesamiento de transacciones.</Bullet>
      <Bullet>Proveedores de KYC para el proceso de verificación de identidad de Organizadores.</Bullet>
      <Bullet>Organizadores del evento al que el Asistente se registra o compra boletas.</Bullet>
      <Bullet>Socios de publicidad para mostrar anuncios según intereses del usuario (con consentimiento).</Bullet>
      <Bullet>En caso de fusión, adquisición o reestructuración empresarial.</Bullet>
      <Bullet>Autoridades judiciales o administrativas cuando la ley lo exija.</Bullet>
      <Notice title="Transferencias internacionales">
        Cuando datos personales sean transferidos a países sin legislación adecuada de protección de
        datos, Do.Events implementará salvaguardas contractuales que garanticen un nivel de protección
        equivalente al de la legislación colombiana, conforme al Decreto 1377 de 2013.
      </Notice>
    </Section>

    <Section title="7. Redes Sociales y Servicios de Terceros">
      <p>
        El usuario puede conectar su cuenta de Do.Events a redes sociales (Facebook, Instagram, TikTok,
        X, Snapchat, entre otras). En ese caso, Do.Events podrá recibir información del perfil del
        usuario en dichas redes (nombre, correo, lista de contactos, imagen de perfil).
      </p>
      <p>
        Do.Events no se hace responsable de las prácticas de privacidad de sitios o servicios de terceros
        enlazados desde la plataforma.
      </p>
    </Section>

    <Section title="8. Derechos del Titular">
      <p>Conforme a la Ley 1581 de 2012, el titular tiene los siguientes derechos:</p>
      <Bullet>Conocer, actualizar y rectificar sus datos personales.</Bullet>
      <Bullet>Solicitar prueba de la autorización otorgada.</Bullet>
      <Bullet>Ser informado sobre el uso dado a sus datos.</Bullet>
      <Bullet>Presentar quejas ante la SIC por infracciones a la ley de protección de datos.</Bullet>
      <Bullet>Revocar la autorización y/o solicitar la supresión de los datos.</Bullet>
      <Bullet>Acceder gratuitamente a sus datos personales.</Bullet>
      <p>
        Para ejercer estos derechos, enviar solicitud a: privacy@doeventsapp.com. Do.Events responderá en
        máximo 10 días hábiles para consultas y 15 días hábiles para reclamos.
      </p>
    </Section>

    <Section title='9. Verificación de Identidad (KYC) y Sello "ORGANIZADOR CERTIFICADO"'>
      <p>
        La verificación de identidad (KYC) NO es un requisito obligatorio para publicar eventos en
        Do.Events. Los Organizadores nuevos están cubiertos por el sistema de escrow y niveles
        progresivos.
      </p>
      <p>Do.Events podrá requerir el proceso KYC en los siguientes casos específicos:</p>
      <Bullet>Eventos de gran escala con aforo superior a 1.000 personas o valor total de boletas superior a $50.000.000 COP.</Bullet>
      <Bullet>Cuando Do.Events detecte señales de alerta o actividad inusual en la cuenta.</Bullet>
      <Bullet>Cuando el Organizador solicite voluntariamente el sello ORGANIZADOR CERTIFICADO.</Bullet>
      <Notice title="Sello ORGANIZADOR CERTIFICADO">
        Los Organizadores que completen el proceso KYC recibirán el sello ORGANIZADOR CERTIFICADO visible
        en su perfil público. El proceso tiene un costo de USD $10 a USD $15 pagadero por el Organizador,
        no reembolsable independientemente del resultado.
      </Notice>
    </Section>

    <Section title="10. Conservación de Datos">
      <Bullet>Datos de cuenta activa: durante la vigencia de la relación con el usuario.</Bullet>
      <Bullet>Datos de transacciones y recaudos: 5 años desde la fecha de la transacción.</Bullet>
      <Bullet>Datos de KYC de Organizadores: 5 años desde la última transacción o cierre de cuenta.</Bullet>
      <Bullet>Datos de clientes y posibles clientes: durante la relación comercial y un período limitado posterior.</Bullet>
      <Bullet>Datos de marketing: hasta que el usuario revoque su consentimiento.</Bullet>
    </Section>

    <Section title="11. Seguridad de los Datos">
      <p>
        Do.Events implementa medidas técnicas y organizativas razonables para proteger los datos
        personales contra pérdida, uso no autorizado, acceso indebido, divulgación y destrucción. Los
        datos de tarjetas de crédito son procesados exclusivamente por Wompi y no son almacenados en los
        sistemas de Do.Events.
      </p>
    </Section>

    <Section title="12. Menores de Edad">
      <p>
        Do.Events no recopila de manera intencional datos personales de personas menores de 18 años. Si
        un padre o tutor detecta que un menor ha proporcionado datos sin su consentimiento, debe
        contactarnos a privacy@doeventsapp.com para la supresión inmediata de esa información.
      </p>
    </Section>

    <Section title="13. Cookies y Tecnologías de Seguimiento">
      <p>
        Do.Events utiliza cookies propias y de terceros para mejorar la experiencia del usuario, analizar
        el uso de la plataforma y mostrar publicidad personalizada. El usuario puede configurar su
        navegador para rechazar cookies, aunque esto puede afectar algunas funcionalidades.
      </p>
    </Section>

    <Section title="14. Cambios en esta Política">
      <p>
        Do.Events podrá actualizar esta política en cualquier momento. Las modificaciones serán
        publicadas en www.doeventsapp.com con al menos 30 días de anticipación antes de su entrada en
        vigencia.
      </p>
    </Section>

    <Section title="15. Resolución de Disputas">
      <p>
        Las controversias relacionadas con el tratamiento de datos personales deben presentarse en
        primera instancia a Do.Events a través de privacy@doeventsapp.com. Si la respuesta no es
        satisfactoria, el titular puede acudir a la Superintendencia de Industria y Comercio (SIC) como
        autoridad de control.
      </p>
      <Notice title="Derecho irrenunciable del Consumidor">
        El titular de datos personales conserva en todo momento el derecho de acudir a la SIC para la
        protección de sus derechos, conforme a la Ley 1581 de 2012. Ninguna cláusula de esta política
        puede interpretarse como renuncia a este derecho.
      </Notice>
    </Section>

    <Section title="16. Exclusiones">
      <p>
        Esta Política de Privacidad no rige sobre datos personales que el usuario proporcione
        directamente a otros usuarios, a Organizadores a través de sus formularios de evento, ni a sitios
        de terceros enlazados desde la plataforma.
      </p>
    </Section>

    <Section title="17. Contacto">
      <Bullet>Responsable del Tratamiento: Do.Events Software SAS</Bullet>
      <Bullet>NIT: 901908812-0</Bullet>
      <Bullet>Dirección: Carrera 91 No. 20A-75, Bogotá D.C., Colombia</Bullet>
      <Bullet>Privacidad y ejercicio de derechos: privacy@doeventsapp.com</Bullet>
      <Bullet>Soporte general: support@doeventsapp.com</Bullet>
      <Bullet>Sitio web: https://doeventsapp.com</Bullet>
    </Section>
  </LegalDocLayout>
);

export default PrivacyPolicyView;
