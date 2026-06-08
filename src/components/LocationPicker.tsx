import { useState, useEffect, useRef } from 'react';
import { Loader2, MapPin } from 'lucide-react';

interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationPickerProps {
  value: string;
  onChange: (location: string) => void;
}

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim() || query === value) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      if (query.trim().length < 2) return;
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=es`,
          { headers: { 'User-Agent': 'PetSocial/1.0' } },
        );
        const data: LocationResult[] = await res.json();
        setResults(data);
        setShowDropdown(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (location: LocationResult) => {
    onChange(location.display_name);
    setQuery(location.display_name);
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 border border-formColorLight/20 rounded-xl px-4 bg-primaryWhite focus-within:border-formColorDark focus-within:ring-2 focus-within:ring-formColorDark/20 transition-all">
        <MapPin className="w-5 h-5 text-primaryBlack/40 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value) onChange('');
          }}
          onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
          placeholder="Buscar ubicación..."
          className="flex-1 py-3 bg-transparent text-primaryBlack placeholder-primaryBlack/40 outline-none text-sm"
        />
        {isSearching && <Loader2 className="w-4 h-4 animate-spin text-primaryBlack/40 flex-shrink-0" />}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-primaryWhite rounded-xl shadow-xl border border-formColorLight/20 max-h-48 overflow-y-auto">
          {results.map((loc, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(loc)}
              className="w-full text-left px-4 py-2.5 text-sm text-primaryBlack hover:bg-formColorLight/10 transition-colors border-b border-formColorLight/10 last:border-0 flex items-start gap-2 cursor-pointer"
            >
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-formColorDark" />
              <span className="line-clamp-2">{loc.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}