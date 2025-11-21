export const BODY_TYPES = ['Sedan', 'SUV', 'Coupe', 'Truck', 'Van', 'Hatchback', 'Convertible', 'Wagon'];

export const FUEL_TYPES = ['Gasoline', 'Diesel', 'Hybrid', 'Electric'];

export const USAGE_GOALS = [
  { value: 'commute', label: 'Daily Commute', icon: 'mdi:car-commute' },
  { value: 'family', label: 'Family', icon: 'mdi:account-group' },
  { value: 'resale', label: 'Resale / Business', icon: 'mdi:cash' },
  { value: 'fun', label: 'Fun / Weekend', icon: 'mdi:car-sports' },
  { value: 'other', label: 'Other', icon: 'mdi:dots-horizontal' },
] as const;

export const REGIONS = ['USA', 'Europe', 'Korea', 'Japan', 'China', 'UAE'];

export const SERVICES = ['Ocean Freight', 'Inland Trucking', 'Customs Clearance', 'Insurance', 'Parts Shipping'];

export const DEALER_INVENTORY_SIZES = ['0-10', '10-50', '50+'];
