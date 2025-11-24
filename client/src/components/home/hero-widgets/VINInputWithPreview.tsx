import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

export function VINInputWithPreview() {
  const [vin, setVin] = useState('');
  const [preview, setPreview] = useState<{ make: string; model: string; year: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Mock VIN decoding effect
  useEffect(() => {
    if (vin.length === 17) {
      setLoading(true);
      // Simulate API call
      const timer = setTimeout(() => {
        setPreview({ make: 'Toyota', model: 'Camry SE', year: 2020 });
        setLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setPreview(null);
    }
  }, [vin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (vin.length >= 17) {
      navigate(`/vin/${vin}`);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white p-4 rounded-xl shadow-md border border-slate-200">
      <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
        Check History & Specs by VIN
      </label>
      <form onSubmit={handleSubmit} className="relative flex gap-2">
        <div className="relative flex-1">
          <Icon 
            icon="mdi:barcode-scan" 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" 
          />
          <Input
            value={vin}
            onChange={(e) => setVin(e.target.value.toUpperCase())}
            placeholder="Enter 17-digit VIN..."
            maxLength={17}
            className="pl-10 font-mono uppercase border-slate-300 focus-visible:ring-primary"
          />
        </div>
        <Button type="submit" disabled={vin.length < 17}>
          {loading ? <Icon icon="mdi:loading" className="animate-spin" /> : 'Check'}
        </Button>
      </form>
      
      {/* Instant Preview Result */}
      {preview && (
        <div className="mt-3 flex items-center justify-between bg-green-50 border border-green-100 p-3 rounded-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-md text-green-700">
              <Icon icon="mdi:check-circle" className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">{preview.year} {preview.make} {preview.model}</p>
              <p className="text-xs text-green-700">VIN Valid • Specs Found</p>
            </div>
          </div>
          <Icon icon="mdi:chevron-right" className="text-green-400" />
        </div>
      )}
    </div>
  );
}

