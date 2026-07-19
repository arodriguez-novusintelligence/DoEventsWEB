import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Input } from '@lovable/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@lovable/components/ui/select';
import type { VenueCatalogOption, VenueCatalogSelection } from '@lovable/data/venueCatalogOptions';
import { resolveCatalogSelection } from '@lovable/data/venueCatalogOptions';

interface VenueSelectWithExtrasProps {
  catalog: VenueCatalogOption[];
  selected: VenueCatalogSelection[];
  onChange: (next: VenueCatalogSelection[]) => void;
  placeholder: string;
  addAnotherLabel: string;
}

const VenueSelectWithExtras = ({
  catalog,
  selected,
  onChange,
  placeholder,
  addAnotherLabel,
}: VenueSelectWithExtrasProps) => {
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const selectedIds = new Set(selected.map((item) => item.id));

  const addSelection = (value: string) => {
    if (!value) return;
    const next = resolveCatalogSelection(value, catalog);
    if (selectedIds.has(next.id)) return;
    onChange([...selected, next]);
  };

  const removeSelection = (id: string) => {
    onChange(selected.filter((item) => item.id !== id));
  };

  const commitCustom = () => {
    const value = customValue.trim();
    if (!value) {
      setCustomOpen(false);
      return;
    }
    addSelection(value);
    setCustomValue('');
    setCustomOpen(false);
  };

  return (
    <div>
      <Select value="" onValueChange={addSelection}>
        <SelectTrigger className="mt-1 rounded-xl border-border bg-secondary/40 shadow-none focus:ring-0">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px] bg-popover">
          {catalog
            .filter((item) => !selectedIds.has(item.id))
            .map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selected.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground"
            >
              {item.label}
              <button type="button" onClick={() => removeSelection(item.id)} aria-label={`Quitar ${item.label}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex justify-end">
        {customOpen ? (
          <div className="flex w-full gap-2">
            <Input
              autoFocus
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder={addAnotherLabel}
              className="h-9"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitCustom();
                }
              }}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCustomOpen(true)}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {addAnotherLabel} <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default VenueSelectWithExtras;
