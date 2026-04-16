import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { supabase } from '../lib/supabase';
import { X, Calculator } from 'lucide-react';

const ZONES = [
  { value: 'zone_a', label: 'Zone A', hint: 'Caribbean / South America' },
  { value: 'zone_b', label: 'Zone B', hint: 'North America (US/Canada)' },
  { value: 'zone_c', label: 'Zone C', hint: 'Netherlands / Europe' },
  { value: 'zone_d', label: 'Zone D', hint: 'Central America / Mexico' },
  { value: 'zone_e', label: 'Zone E', hint: 'South America / Brazil' },
  { value: 'zone_f', label: 'Zone F', hint: 'Africa / Middle East' },
  { value: 'zone_g', label: 'Zone G', hint: 'Asia / Far East' },
  { value: 'zone_h', label: 'Zone H', hint: 'Australia / Pacific' },
];

interface Props {
  currentWeight: number;
  onApply: (amount: number, currency: string) => void;
  onClose: () => void;
}

export const FreightCalculatorModal: React.FC<Props> = ({
  currentWeight, onApply, onClose
}) => {
  const [zone, setZone] = useState('zone_c');
  const [weight, setWeight] = useState(currentWeight || 0);
  const [result, setResult] = useState<{ rate: number; currency: string; bracketWeight: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculate = async () => {
    if (!weight || weight <= 0) { setError('Enter a valid weight.'); return; }
    setError('');
    setLoading(true);

    // Find the rate for this weight — get the closest bracket >= weight
    const { data, error: dbErr } = await supabase
      .from('freight_rates')
      .select(`weight, currency, ${zone}`)
      .gte('weight', weight)
      .order('weight', { ascending: true })
      .limit(1);

    if (dbErr || !data || data.length === 0) {
      // Weight exceeds all brackets — get the highest bracket
      const { data: maxData } = await supabase
        .from('freight_rates')
        .select(`weight, currency, ${zone}`)
        .order('weight', { ascending: false })
        .limit(1);

      if (maxData && maxData.length > 0) {
        const row = maxData[0] as any;
        setResult({
          rate: parseFloat(row[zone]) || 0,
          currency: row.currency || 'USD',
          bracketWeight: parseFloat(row.weight),
        });
      } else {
        setError('Rate not found. Check that freight rates are seeded.');
      }
    } else {
      const row = data[0] as any;
      setResult({
        rate: parseFloat(row[zone]) || 0,
        currency: row.currency || 'USD',
        bracketWeight: parseFloat(row.weight),
      });
    }
    setLoading(false);
  };

  const selectedZone = ZONES.find(z => z.value === zone);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Freight Rate Calculator</h2>
              <p className="text-sm text-muted-foreground">Based on VD freight rate table</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-5 space-y-4">

          {/* Zone */}
          <div className="space-y-2">
            <Label>Shipping Zone</Label>
            <Select value={zone} onValueChange={setZone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ZONES.map(z => (
                  <SelectItem key={z.value} value={z.value}>
                    {z.label} — {z.hint}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedZone && (
              <p className="text-xs text-muted-foreground">{selectedZone.hint}</p>
            )}
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <Label>Gross Weight (kg)</Label>
            <Input
              type="number"
              value={weight}
              onChange={e => { setWeight(parseFloat(e.target.value) || 0); setResult(null); }}
              placeholder="Enter weight in kg"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            className="w-full"
            onClick={calculate}
            disabled={loading || !weight}
          >
            {loading ? 'Looking up...' : 'Calculate Rate'}
          </Button>

          {/* Result */}
          {result && (
            <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Rate for {weight} kg ({selectedZone?.label})
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Using bracket: {result.bracketWeight} kg
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {result.currency} {result.rate.toFixed(2)}
                  </div>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => { onApply(result.rate, result.currency); onClose(); }}
              >
                Use this rate — fill External Freight
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
