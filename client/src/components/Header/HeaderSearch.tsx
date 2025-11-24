import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderSearchProps {
    className?: string;
}

export function HeaderSearch({ className }: HeaderSearchProps) {
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
      // Mock instant preview for VIN
      if (query.length === 17 && !query.includes(' ')) {
          setPreview("Toyota Camry 2020 (Est. $12,500)");
      } else {
          setPreview(null);
      }
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const isVin = query.length === 17 && !query.includes(' ');
    if (isVin) {
        navigate(`/vin/${query}`);
    } else {
        navigate(`/catalog?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <form onSubmit={handleSearch} className="relative">
        <Input 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter VIN (17 chars) or Model..." 
          className="pl-10 pr-4 h-10 bg-slate-100 border-slate-200 focus-visible:bg-white focus-visible:ring-primary transition-all"
        />
        <Icon 
           icon="mdi:magnify" 
           className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" 
        />
        {query.length > 0 && (
            <button 
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
                <Icon icon="mdi:close-circle" className="h-4 w-4" />
            </button>
        )}
      </form>
      
      {/* Instant Preview Dropdown */}
      {preview && (
          <div 
            className="absolute top-full mt-2 left-0 w-full bg-white rounded-lg shadow-xl border border-slate-100 p-3 z-50 animate-in fade-in slide-in-from-top-1 cursor-pointer hover:bg-slate-50"
            onClick={handleSearch}
          >
              <div className="flex items-center gap-3">
                  <div className="bg-green-100 text-green-700 p-2 rounded-md">
                      <Icon icon="mdi:car" className="h-5 w-5" />
                  </div>
                  <div>
                      <p className="text-sm font-bold text-slate-900">{preview}</p>
                      <p className="text-xs text-green-600">Click to calculate exact price</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
