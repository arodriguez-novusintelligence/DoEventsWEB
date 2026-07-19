import React, { useEffect, useRef, useState } from 'react';
import { searchPlaceSuggestions, type GeocodedPlace } from '../lib/geocodePlace';

export interface PlaceAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: GeocodedPlace) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  id?: string;
  minChars?: number;
  maxSuggestions?: number;
}

export const PlaceAutocompleteInput: React.FC<PlaceAutocompleteInputProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  className = '',
  inputClassName = '',
  disabled = false,
  id,
  minChars = 2,
  maxSuggestions = 6,
}) => {
  const [suggestions, setSuggestions] = useState<GeocodedPlace[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const fetchSuggestions = (query: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const trimmed = query.trim();
    if (trimmed.length < minChars) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const items = await searchPlaceSuggestions(trimmed, maxSuggestions);
        setSuggestions(items);
        setOpen(items.length > 0);
      } finally {
        setLoading(false);
      }
    }, 280);
  };

  const handleInput = (next: string) => {
    onChange(next);
    setOpen(true);
    fetchSuggestions(next);
  };

  const selectPlace = (place: GeocodedPlace) => {
    // Si el padre maneja la selección, él define el valor controlado
    // (p. ej. calle corta vs label geocoder). Evita pisar con el label compuesto.
    if (onPlaceSelect) {
      onPlaceSelect(place);
    } else {
      onChange(place.street?.trim() || place.label);
    }
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        id={id}
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => {
          if (value.trim().length >= minChars) {
            fetchSuggestions(value);
          } else {
            setOpen(suggestions.length > 0);
          }
        }}
        className={inputClassName}
      />
      {loading && (
        <p className="mt-1 text-xs text-muted-foreground">Buscando ubicaciones…</p>
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-border bg-popover shadow-md">
          {suggestions.map((place) => (
            <li key={`${place.lat}-${place.lng}-${place.label}`}>
              <button
                type="button"
                className="w-full px-3 py-2.5 text-left text-sm text-foreground hover:bg-muted"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectPlace(place)}
              >
                <span className="block font-medium">{place.label}</span>
                {(place.city || place.departamento) && (
                  <span className="block text-xs text-muted-foreground">
                    {[place.city, place.departamento, place.country].filter(Boolean).join(' · ')}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PlaceAutocompleteInput;
