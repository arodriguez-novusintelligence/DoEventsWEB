import type { SeatingMapTemplate } from '@lovable/data/seatingTemplates';
import { formatTemplateCapacityLabel } from '@lovable/data/seatingTemplates';

interface SeatingTemplateInfoPanelProps {
  template: SeatingMapTemplate;
  compact?: boolean;
}

export const SeatingTemplateInfoPanel: React.FC<SeatingTemplateInfoPanelProps> = ({
  template,
  compact = false,
}) => (
  <div className={`space-y-3 text-xs text-muted-foreground ${compact ? '' : 'rounded-xl border border-border bg-muted/30 p-3'}`}>
    <div className="grid grid-cols-2 gap-2">
      <div>
        <p className="font-semibold text-foreground">Aforo modelado</p>
        <p>{formatTemplateCapacityLabel(template)}</p>
      </div>
      <div>
        <p className="font-semibold text-foreground">Niveles</p>
        <p>{template.floors.length} piso(s)</p>
      </div>
    </div>

    <div>
      <p className="font-semibold text-foreground mb-1">Distribución por nivel</p>
      <ul className="space-y-1">
        {template.levels.map((level) => (
          <li key={level.floor}>
            <span className="font-medium text-foreground">Piso {level.floor} — {level.label}:</span>{' '}
            {level.description}
          </li>
        ))}
      </ul>
    </div>

    <div>
      <p className="font-semibold text-foreground mb-1">
        Zonas de silletería ({template.zones.length})
      </p>
      <ul className={`space-y-1 ${compact ? 'max-h-32 overflow-y-auto' : 'max-h-48 overflow-y-auto'}`}>
        {template.zones.map((zone) => (
          <li key={zone.id} className="border-b border-border/50 pb-1 last:border-0">
            <span className="font-medium text-foreground">{zone.name}</span>
            {' · '}
            {zone.seats.toLocaleString('es-CO')} sillas · {zone.sectors}
          </li>
        ))}
      </ul>
    </div>

    {!compact && template.sectionsNotIncluded.length > 0 && (
      <div>
        <p className="font-semibold text-foreground mb-1">No incluido en esta plantilla base</p>
        <ul className="list-disc pl-4 space-y-0.5">
          {template.sectionsNotIncluded.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

export default SeatingTemplateInfoPanel;
