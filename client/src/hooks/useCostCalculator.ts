import { useState, useEffect, useCallback } from 'react';

export interface CostBreakdown {
  auctionPrice: number;
  shipping: number;
  customs: number;
  brokerFee: number;
  total: number;
  currency: 'USD' | 'GEL';
}

const DEFAULT_VALUES = {
  auctionPrice: 5000,
  shipping: 1200,
  engineVolume: 2.0,
  year: 2018,
  isHybrid: false,
};

const STORAGE_KEY = 'projectx_cost_calculator';

export function useCostCalculator() {
  const [values, setValues] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    }
    return DEFAULT_VALUES;
  });

  const [breakdown, setBreakdown] = useState<CostBreakdown | null>(null);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    calculateTotal();
  }, [values]);

  const calculateTotal = useCallback(() => {
    // Mock calculation logic relative to Georgian customs (simplified)
    // In a real app, this would call an API or use precise formulas
    
    const { auctionPrice, shipping, engineVolume, year, isHybrid } = values;
    
    // 1. Customs Duty (Simplified Georgian formula approximation)
    // Base rate per cc based on age
    const age = new Date().getFullYear() - year;
    let ratePerCc = 0;
    if (age < 3) ratePerCc = 1.5;
    else if (age < 6) ratePerCc = 1.0;
    else if (age < 9) ratePerCc = 0.8; // Sweet spot
    else if (age < 12) ratePerCc = 1.2;
    else ratePerCc = 2.0;

    let customs = (engineVolume * 1000) * ratePerCc * 0.2; // Approx
    if (isHybrid) customs *= 0.5; // Hybrid discount

    const brokerFee = 150; // Standard broker fee

    const totalUSD = auctionPrice + shipping + customs + brokerFee;

    setBreakdown({
      auctionPrice,
      shipping,
      customs: Math.round(customs),
      brokerFee,
      total: Math.round(totalUSD),
      currency: 'USD'
    });
  }, [values]);

  const updateValue = (key: keyof typeof DEFAULT_VALUES, value: number | boolean) => {
    setValues((prev: typeof DEFAULT_VALUES) => ({ ...prev, [key]: value }));
  };

  return {
    values,
    updateValue,
    breakdown
  };
}

