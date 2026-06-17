import { ChevronLeft } from 'lucide-react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h2 className="text-base font-bold text-primary mt-5 mb-2">{title}</h2>
    <div className="space-y-3 text-sm text-foreground leading-relaxed">{children}</div>
  </div>
);

const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mt-3">
    <h3 className="text-sm font-bold text-foreground mb-2">{title}</h3>
    <div className="space-y-2 text-sm text-foreground leading-relaxed">{children}</div>
  </div>
);

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-2">
    <span className="text-primary mt-1">•</span>
    <p className="flex-1">{children}</p>
  </div>
);

const Notice = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 mt-3">
    <p className="font-bold text-foreground mb-1">{title}</p>
    <p className="text-sm text-foreground leading-relaxed">{children}</p>
  </div>
);

const RefundPolicyView = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="mx-auto max-w-lg pb-24 min-h-screen bg-background">
      <div className="px-4 pt-4">
        <button onClick={onBack} className="flex items-center gap-1 text-primary font-medium mb-4">
          <ChevronLeft className="h-5 w-5" />
          Atras
        </button>
        <h1 className="text-2xl font-extrabold text-primary leading-tight mb-4">
          Política de Recaudos y Reembolsos
        </h1>

        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <p className="text-sm text-foreground leading-relaxed">
            En Do.Events, nos comprometemos a ofrecer claridad y transparencia sobre nuestra política
            de reembolsos para tickets o boletos adquiridos a través de nuestro sitio web / app.
          </p>

          <Section title="1. Tasas y cargos">
            <p>
              Nuestros clientes pueden cancelar su compra en cualquier momento antes de que el evento se
              lleve a cabo, sujeto a las políticas de reembolso detalladas a continuación. Al adquirir un
              ticket en Do.Events, aceptas pagar el precio del ticket <strong>(más los recargos aplicables)</strong>{' '}
              utilizando el método de pago seleccionado al momento de la compra.
            </p>
            <Bullet>
              <strong>Importante:</strong> Algunos cargos de gestión o procesamiento no son reembolsables.
            </Bullet>
          </Section>

          <Section title="2. Modalidades de Pago y Custodia de Fondos (Escrow)">
            <p>
              Do.Events opera bajo dos modalidades de pago que el Asistente debe seleccionar activamente al
              momento de la compra. La opción por defecto es la Compra Protegida.
            </p>

            <SubSection title="2.1 Modalidad A — Compra Protegida (opción por defecto)">
              <p>
                El valor de la boleta queda en custodia (escrow) a través de la pasarela de pagos Wompi hasta
                D+1 después de la fecha de finalización del evento. Transcurridas 24 horas sin reclamaciones
                válidas, los fondos son liberados automáticamente al Organizador.
              </p>
              <p>Bajo esta modalidad:</p>
              <Bullet>
                Si el evento NO ocurre o es cancelado: Do.Events gestiona el reembolso completo al Asistente
                de forma automática.
              </Bullet>
              <Bullet>
                Si el evento ocurre satisfactoriamente: los fondos son transferidos al Organizador según las
                condiciones de liquidación aplicables a su nivel de reputación.
              </Bullet>
              <Bullet>
                El Asistente tiene una ventana de 24 horas post-evento para reportar incidencias a través de
                management@doeventsapp.com.
              </Bullet>
              <Notice title="Protección del Consumidor">
                Esta modalidad cumple con el régimen de garantías y derecho de retracto establecido en la Ley
                1480 de 2011 (Estatuto del Consumidor colombiano). El Asistente conserva todos sus derechos
                legales de retracto dentro de los 5 días hábiles siguientes a la compra cuando el evento aún
                no ha ocurrido.
              </Notice>
            </SubSection>

            <SubSection title="2.2 Modalidad B — Transferencia Inmediata al Organizador">
              <p>
                Esta modalidad solo estará disponible para Organizadores con historial verificado y reputación
                consolidada en la plataforma. El Asistente debe seleccionar activamente esta opción mediante
                una acción explícita e informada en el flujo de compra.
              </p>
              <p>Al elegir esta modalidad, el Asistente declara expresamente:</p>
              <Bullet>Conocer al Organizador y confiar en la realización del evento.</Bullet>
              <Bullet>Comprender que el pago es transferido de forma inmediata al Organizador.</Bullet>
              <Bullet>
                Entender que, en caso de cancelación, la reclamación de reembolso recae sobre el Organizador,
                no sobre Do.Events.
              </Bullet>
              <Bullet>
                Haber sido informado de que conserva el derecho de retracto de 5 días hábiles conforme a la
                Ley 1480 de 2011, siempre que la solicitud sea presentada antes de la fecha del evento.
              </Bullet>
              <Notice title="Aviso importante">
                Do.Events no puede ser seleccionada por defecto como opción la Transferencia Inmediata. El
                Asistente debe realizar un acto afirmativo y consciente para elegirla. Do.Events no será
                responsable de reembolsos bajo esta modalidad, sin perjuicio de la responsabilidad solidaria
                que pueda corresponder conforme al artículo 53 de la Ley 1480 de 2011 en casos de fraude
                comprobado del Organizador.
              </Notice>
            </SubSection>
          </Section>

          <Section title="3. Política de Reembolso">
            <p>
              La eligibilidad para reembolso depende de la modalidad de pago seleccionada y de las
              condiciones del evento:
            </p>

            <SubSection title="3.1 Reembolso completo">
              <Bullet>El evento es cancelado por el Organizador (aplica ambas modalidades).</Bullet>
              <Bullet>
                El Asistente ejerce su derecho de retracto dentro de los 5 días hábiles siguientes a la
                compra, siempre que el evento aún no haya ocurrido (Ley 1480, Art. 47).
              </Bullet>
              <Bullet>
                Do.Events fuerza un reembolso por actividad fraudulenta comprobada del Organizador.
              </Bullet>
            </SubSection>

            <SubSection title="3.2 Sin reembolso">
              <Bullet>El ticket ya fue utilizado para acceder al evento.</Bullet>
              <Bullet>El evento ya ocurrió satisfactoriamente.</Bullet>
              <Bullet>
                Se solicitó reembolso bajo la Modalidad B (Transferencia Inmediata) después de vencido el
                plazo de retracto legal, en cuyo caso la reclamación debe dirigirse directamente al
                Organizador.
              </Bullet>
            </SubSection>

            <SubSection title="3.3 Cómo solicitar un reembolso">
              <p>
                El proceso de solicitud de reembolso bajo la Modalidad A (Compra Protegida) se realiza
                directamente desde la plataforma, sin necesidad de contactar al equipo de soporte:
              </p>
              <Bullet>
                Ingresa a la app o web de Do.Events y dirígete a la sección <strong>Mis Boletos</strong>.
              </Bullet>
              <Bullet>
                Selecciona el evento y las boletas que deseas reembolsar (puedes seleccionar una o todas).
              </Bullet>
              <Bullet>
                Presiona <strong>Solicitar Reembolso</strong>, revisa el resumen con el monto a reembolsar y
                confirma la solicitud.
              </Bullet>
              <Bullet>
                Una vez confirmada la solicitud, el proceso es automático e irreversible. Recibirás una
                confirmación por correo electrónico.
              </Bullet>
              <Bullet>
                Los reembolsos se procesan en un plazo de 3 a 5 días hábiles, sujeto a los tiempos de la
                pasarela de pagos y la entidad bancaria del Asistente.
              </Bullet>
              <p>
                <strong>Monto reembolsable:</strong> El reembolso corresponde únicamente al{' '}
                <strong>costo neto del boleto</strong>. La comisión de la plataforma no es reembolsable bajo
                ninguna circunstancia, incluyendo cancelaciones de evento. La comisión de Do.Events es de{' '}
                <strong>8% + $1.500 COP + IVA por boleto vendido</strong>, y es asumida por el comprador
                final en el momento de la compra. Este cargo cubre el procesamiento tecnológico, la pasarela
                de pagos y los servicios de la plataforma, y no está sujeto a devolución.
              </p>
              <p>
                Ejemplo: si el boleto tiene un precio de $300.000 COP, la comisión de la plataforma es de
                $25.500 COP (8%) + $1.500 COP + IVA. El monto reembolsable es el valor del boleto menos
                dicha comisión.
              </p>
              <p>
                Para soporte adicional en el proceso de reembolso puedes escribirnos a
                management@doeventsapp.com.
              </p>
            </SubSection>
          </Section>

          <Section title="4. Depósito de Garantía del Organizador">
            <p>
              Con el fin de proteger a los Asistentes y garantizar la seriedad de los eventos publicados,
              Do.Events podrá exigir a los Organizadores un depósito de garantía en los siguientes casos:
            </p>
            <Bullet>Eventos con aforo superior a 500 personas.</Bullet>
            <Bullet>Eventos con valor total de boletas superior a $10.000.000 COP.</Bullet>
            <Bullet>Organizadores nuevos sin historial verificado en la plataforma.</Bullet>
            <Bullet>
              Eventos en modalidades o categorías de alto riesgo, a discreción de Do.Events.
            </Bullet>
            <p>
              El depósito será equivalente al 5% al 10% del valor total estimado de la venta de boletas y
              será devuelto al Organizador dentro de los 5 días hábiles siguientes a la finalización exitosa
              del evento. En caso de cancelación imputable al Organizador, el depósito podrá ser destinado
              parcial o totalmente a cubrir reembolsos a los Asistentes.
            </p>
          </Section>

          <Section title="5. Límites Progresivos y Niveles de Reputación">
            <p>
              Do.Events implementa un sistema de niveles progresivos para la gestión de fondos de los
              Organizadores, basado en el historial y la reputación en la plataforma.
            </p>

            <SubSection title="Nivel 1 — Organizador Nuevo (0–2 eventos realizados)">
              <Bullet>
                Do.Events podrá requerir verificación de identidad (KYC) a discreción, especialmente en
                eventos de gran escala.
              </Bullet>
              <Bullet>Límite máximo de 200 boletas por evento.</Bullet>
              <Bullet>Depósito de garantía obligatorio.</Bullet>
              <Bullet>
                Solo disponible la Modalidad A (Compra Protegida). La Modalidad B no está habilitada.
              </Bullet>
              <Bullet>
                Los fondos son transferidos al Organizador únicamente después de la finalización verificada
                del evento (D+1).
              </Bullet>
            </SubSection>

            <SubSection title="Nivel 2 — Organizador en Desarrollo (3–5 eventos con calificación ≥4 estrellas)">
              <Bullet>Límite ampliado a 1.000 boletas por evento.</Bullet>
              <Bullet>Depósito de garantía requerido para eventos de alto valor.</Bullet>
              <Bullet>Fondos transferidos D+1 post-evento.</Bullet>
              <Bullet>Modalidad B disponible con restricciones.</Bullet>
            </SubSection>

            <SubSection title="Nivel 3 — Organizador Verificado (6+ eventos con calificación ≥4.5 estrellas)">
              <Bullet>Sin límite de boletas (sujeto a políticas de cada evento).</Bullet>
              <Bullet>Depósito de garantía solo para mega-eventos (+5.000 personas).</Bullet>
              <Bullet>
                Posibilidad de adelanto parcial de fondos antes del evento, a discreción de Do.Events.
              </Bullet>
              <Bullet>Modalidad B completamente disponible.</Bullet>
            </SubSection>

            <Notice title="Nota">
              Do.Events se reserva el derecho de reclasificar a un Organizador a un nivel inferior si se
              detectan incumplimientos, cancelaciones injustificadas, reclamaciones reiteradas de Asistentes
              o actividad fraudulenta.
            </Notice>
          </Section>

          <Section title='6. Verificación de Identidad del Organizador (KYC) y Sello "ORGANIZADOR CERTIFICADO"'>
            <p>
              La verificación de identidad (Know Your Customer — KYC) NO es un requisito obligatorio para
              publicar eventos en Do.Events. Los Organizadores nuevos sin historial están protegidos por el
              sistema de niveles progresivos y escrow: los fondos se liberan únicamente después de la
              finalización verificada del evento.
            </p>

            <SubSection title="6.1 Cuándo aplica el proceso KYC">
              <Bullet>
                Eventos de gran escala con aforo superior a 1.000 personas o valor total de boletas superior
                a $50.000.000 COP.
              </Bullet>
              <Bullet>
                Cuando Do.Events detecte señales de alerta o actividad inusual en la cuenta del Organizador.
              </Bullet>
              <Bullet>
                Cuando el Organizador solicite voluntariamente obtener el sello de{' '}
                <strong>ORGANIZADOR CERTIFICADO</strong>.
              </Bullet>
            </SubSection>

            <SubSection title='6.2 Sello "ORGANIZADOR CERTIFICADO"'>
              <p>
                El sello <strong>ORGANIZADOR CERTIFICADO</strong> es una insignia visible en el perfil del
                Organizador, otorgada por Do.Events tras completar satisfactoriamente el proceso de
                verificación de identidad.
              </p>
              <Bullet>
                <strong>Persona natural:</strong> validación de cédula, verificación facial mediante selfie
                y confirmación de datos bancarios.
              </Bullet>
              <Bullet>
                <strong>Persona jurídica:</strong> cédula y verificación facial del representante legal,
                Cámara de Comercio vigente (no mayor a 90 días), RUT actualizado, datos bancarios y NIT.
              </Bullet>
              <p>
                El proceso de certificación KYC tiene un costo de <strong>USD $10 a USD $15</strong> (o su
                equivalente en pesos colombianos a la TRM del día), pagadero por el Organizador al momento
                de solicitar la certificación. Este cargo no es reembolsable, independientemente del
                resultado del proceso.
              </p>
            </SubSection>
          </Section>

          <Section title="7. Seguro de Evento Cancelado (Recomendación)">
            <p>
              Do.Events recomienda a todos los Organizadores, especialmente a quienes realizan eventos de
              gran escala, contratar un seguro de evento cancelado con aseguradoras autorizadas en Colombia
              como Seguros Bolívar, Sura, o Mapfre.
            </p>
            <p>Este tipo de póliza puede cubrir:</p>
            <Bullet>Cancelación o postergación forzada del evento por causas de fuerza mayor.</Bullet>
            <Bullet>Costos de producción no recuperables.</Bullet>
            <Bullet>
              Reembolsos a Asistentes cuando los fondos ya fueron transferidos al Organizador (Modalidad B).
            </Bullet>
          </Section>

          <Section title="8. Pagos con Tarjeta de Crédito y Débito">
            <p>
              Do.Events procesa todos los pagos exclusivamente a través de Wompi, pasarela de pagos
              certificada y vigilada en Colombia. Do.Events no almacena datos de tarjetas de crédito o
              débito de los Asistentes.
            </p>
            <p>
              La liquidación de fondos al Organizador se realiza según el nivel de reputación asignado y la
              modalidad de pago elegida por el Asistente. Do.Events se reserva el derecho de retener fondos
              en caso de disputas, reclamaciones de fraude, devoluciones o incumplimiento de estos términos.
            </p>
          </Section>

          <Section title="9. Pagos Pendientes">
            <p>
              En el caso de que el Organizador adeude a Do.Events un importe, dicho monto generará intereses
              calculados a la tasa máxima permitida por la ley vigente en Colombia. Do.Events podrá deducir
              dicho importe del saldo pendiente del Organizador o emitir una factura al Organizador, quien
              deberá abonarla en un plazo de 30 días.
            </p>
          </Section>

          <Section title="10. Impuestos y Retenciones">
            <p>
              Do.Events opera desde Colombia y aplica por defecto los impuestos requeridos por el Gobierno
              Colombiano relacionados con la venta de productos en línea (RETEIVA y RETEFUENTE), calculados
              sobre el valor de las boletas y descontados antes de la transferencia al Organizador.
            </p>
            <p>
              Los Organizadores que consideren que dichos impuestos no les aplican podrán solicitar una
              revisión a management@doeventsapp.com. El proceso de revisión puede tomar hasta 30 días.
            </p>
          </Section>

          <Section title="11. Contáctanos">
            <p>Si necesitas más información o asistencia, no dudes en comunicarte con nosotros:</p>
            <Bullet>
              Soporte general:{' '}
              <a href="mailto:support@doeventsapp.com" className="text-primary underline">
                support@doeventsapp.com
              </a>
            </Bullet>
            <Bullet>
              Asuntos de gestión y reembolsos:{' '}
              <a href="mailto:management@doeventsapp.com" className="text-primary underline">
                management@doeventsapp.com
              </a>
            </Bullet>
            <Bullet>
              Sitio web:{' '}
              <a
                href="https://doeventsapp.com/contacts"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                https://doeventsapp.com/contacts
              </a>
            </Bullet>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicyView;
