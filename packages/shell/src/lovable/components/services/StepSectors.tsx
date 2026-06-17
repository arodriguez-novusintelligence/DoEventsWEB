import { useState } from 'react';
import { SERVICE_SECTORS, SECTOR_ACTIVITIES, ServiceFormData } from '@lovable/data/servicesData';
import { Checkbox } from '@lovable/components/ui/checkbox';
import { Input } from '@lovable/components/ui/input';
import { Button } from '@lovable/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@lovable/components/ui/collapsible';
import { cn } from '@lovable/lib/utils';
import { ChevronDown, Briefcase, ListChecks } from 'lucide-react';

interface StepSectorsProps {
  formData: ServiceFormData;
  updateForm: (partial: Partial<ServiceFormData>) => void;
  onNext: () => void;
}

const StepSectors = ({ formData, updateForm, onNext }: StepSectorsProps) => {
  const [showOtherSector, setShowOtherSector] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    sectors: true,
    activities: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSector = (sector: string) => {
    const next = formData.sectors.includes(sector)
      ? formData.sectors.filter((s) => s !== sector)
      : [...formData.sectors, sector];
    updateForm({ sectors: next });
  };

  const toggleActivity = (sector: string, activity: string) => {
    const current = formData.activities[sector] || [];
    const next = current.includes(activity)
      ? current.filter((a) => a !== activity)
      : [...current, activity];
    updateForm({ activities: { ...formData.activities, [sector]: next } });
  };

  const canContinue = formData.sectors.length > 0;

  const SectionHeader = ({
    icon: Icon,
    title,
    sectionKey,
  }: {
    icon: React.ElementType;
    title: string;
    sectionKey: string;
  }) => (
    <CollapsibleTrigger
      className="flex w-full items-center gap-3 rounded-2xl bg-card px-4 py-4 shadow-sm transition-colors hover:bg-accent/50"
      onClick={() => toggleSection(sectionKey)}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <span className="flex-1 text-left text-sm font-semibold text-foreground">{title}</span>
      <ChevronDown
        className={cn(
          'h-5 w-5 text-primary transition-transform',
          openSections[sectionKey] && 'rotate-180'
        )}
      />
    </CollapsibleTrigger>
  );

  return (
    <div className="space-y-4">
      {/* 1. Sector selection */}
      <Collapsible open={openSections.sectors}>
        <SectionHeader icon={Briefcase} title="¿Qué tipo de servicio(s) prestas?" sectionKey="sectors" />
        <CollapsibleContent className="mt-2 px-1">
          <div className="rounded-2xl bg-card p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {SERVICE_SECTORS.map((sector) => (
                <button
                  key={sector}
                  onClick={() => toggleSector(sector)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    formData.sectors.includes(sector)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-accent text-accent-foreground'
                  )}
                >
                  {sector}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Checkbox
                checked={showOtherSector}
                onCheckedChange={(v) => setShowOtherSector(!!v)}
              />
              <span className="text-sm text-foreground">Otro. ¿Cuál?</span>
            </div>
            {showOtherSector && (
              <Input
                className="mt-2"
                placeholder="Describe tu sector"
                value={formData.sectorOther}
                onChange={(e) => updateForm({ sectorOther: e.target.value })}
              />
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 2. Activities per selected sector */}
      <Collapsible open={openSections.activities}>
        <SectionHeader icon={ListChecks} title="Selecciona las actividades" sectionKey="activities" />
        <CollapsibleContent className="mt-2 space-y-3 px-1">
          {formData.sectors.length === 0 ? (
            <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-sm">
              Selecciona al menos un servicio primero.
            </p>
          ) : (
            formData.sectors.map((sector) => {
              const activities = SECTOR_ACTIVITIES[sector] || [];
              if (activities.length === 0) return null;
              const selectedActivities = formData.activities[sector] || [];
              const otherText = formData.activityOthers[sector] || '';

              return (
                <div key={sector} className="rounded-2xl bg-card p-4 shadow-sm">
                  <h4 className="mb-3 text-base font-semibold text-foreground">{sector}</h4>
                  <div className="flex flex-wrap gap-2">
                    {activities.map((act) => (
                      <button
                        key={act}
                        onClick={() => toggleActivity(sector, act)}
                        className={cn(
                          'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                          selectedActivities.includes(act)
                            ? 'bg-primary/20 text-primary font-semibold'
                            : 'bg-accent text-accent-foreground'
                        )}
                      >
                        {act}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Checkbox
                      checked={!!otherText || false}
                      onCheckedChange={(v) => {
                        if (!v) updateForm({ activityOthers: { ...formData.activityOthers, [sector]: '' } });
                      }}
                    />
                    <span className="text-sm text-foreground">Otro. ¿Cuál?</span>
                  </div>
                  <Input
                    className="mt-2"
                    placeholder="Describe la actividad"
                    value={otherText}
                    onChange={(e) =>
                      updateForm({ activityOthers: { ...formData.activityOthers, [sector]: e.target.value } })
                    }
                  />
                </div>
              );
            })
          )}
        </CollapsibleContent>
      </Collapsible>

      <Button
        onClick={onNext}
        disabled={!canContinue}
        className="w-full rounded-full py-6 text-base font-semibold"
      >
        Guardar y Continuar
      </Button>
    </div>
  );
};

export default StepSectors;
