// Mock data for development and testing
// All data should be sourced from this file during development
// TODO-FX: Replace with real API calls

import { faker } from '@faker-js/faker';

const socialPlatforms = [
  { label: 'Facebook', domain: 'facebook.com', icon: 'mdi:facebook' },
  { label: 'Instagram', domain: 'instagram.com', icon: 'mdi:instagram' },
  { label: 'LinkedIn', domain: 'linkedin.com', icon: 'mdi:linkedin' },
  { label: 'YouTube', domain: 'youtube.com', icon: 'mdi:youtube' },
  { label: 'TikTok', domain: 'tiktok.com', icon: 'mdi:tiktok' }
];

const generateSocialLinks = () => {
  const count = faker.number.int({ min: 1, max: 3 });

  return Array.from({ length: count }).map(() => {
    const platform = faker.helpers.arrayElement(socialPlatforms);
    const handle = faker.internet.username().toLowerCase().replace(/[^a-z0-9]/g, '');

    return {
      id: faker.string.uuid(),
      label: platform.label,
      url: `https://${platform.domain}/${handle}`,
      icon: platform.icon
    };
  });
};

// Generate mock companies
const generateCompanies = (count = 20) => {
  const services = [
    'Full Import Service', 'Documentation', 'Shipping', 'Customs Clearance',
    'Vehicle Inspection', 'Insurance', 'Storage', 'Delivery'
  ];

  const states = [
    'California', 'Texas', 'Florida', 'New York', 'Illinois',
    'Pennsylvania', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'
  ];

  return Array.from({ length: count }, (_, i) => {
    const companyName = `${faker.company.name()} Auto Import`;
    const slug = faker.helpers.slugify(companyName).toLowerCase();
    const baseFee = faker.number.int({ min: 800, max: 2000 });
    const customsFee = faker.number.int({ min: 400, max: 1200 });
    const serviceFee = faker.number.int({ min: 300, max: 1500 });
    const brokerFee = faker.number.int({ min: 150, max: 600 });
    const pricePerMile = faker.number.int({ min: 5, max: 25 }) / 100;

    const reviewCount = faker.number.int({ min: 5, max: 100 });
    const reviews = Array.from({ length: Math.min(reviewCount, 10) }, () => ({
      id: faker.string.uuid(),
      userName: faker.person.fullName(),
      rating: faker.number.int({ min: 2, max: 10 }),
      comment: faker.lorem.sentence({ min: 10, max: 30 }),
      date: faker.date.past({ years: 1 }).toISOString().split('T')[0]
    }));

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const onboardingEndsAt = faker.datatype.boolean({ probability: 0.3 })
      ? faker.date.future({ years: 1 }).toISOString()
      : null;
    const minPrice = baseFee + customsFee + serviceFee + brokerFee;
    const maxPrice = minPrice + pricePerMile * 1000;

    const vipStatus = faker.datatype.boolean({ probability: 0.3 });

    const ratingScore = (avgRating / 10) * 70;
    const reviewScore = Math.min(20, Math.log10(reviewCount + 1) * 10);
    const vipBonus = vipStatus ? 10 : 0;
    const trustScore = Math.round(Math.min(100, ratingScore + reviewScore + vipBonus));

    return {
      id: (i + 1).toString(),
      slug,
      name: companyName,
      logo: `https://api.dicebear.com/7.x/initials/svg?seed=${faker.company.name()}`,
      description: faker.lorem.sentences({ min: 2, max: 4 }),
      services: faker.helpers.arrayElements(services, { min: 2, max: 5 }),
      priceRange: {
        min: minPrice,
        max: maxPrice,
        currency: 'USD'
      },
      fees: {
        base: baseFee,
        pricePerMile,
        customs: customsFee,
        service: serviceFee,
        broker: brokerFee
      },
      pricingFormula: null,
      rating: Math.round(avgRating * 10) / 10,
      reviewCount,
      vipStatus,
      trustScore,
      onboarding: {
        isFree: faker.datatype.boolean({ probability: 0.4 }),
        endsAt: onboardingEndsAt
      },
      location: {
        state: faker.helpers.arrayElement(states),
        city: faker.location.city()
      },
      contact: {
        email: faker.internet.email(),
        phone: faker.phone.number(),
        website: faker.internet.url()
      },
      socialLinks: generateSocialLinks(),
      establishedYear: faker.number.int({ min: 1990, max: 2020 }),
      reviews
    };
  });
};

export const mockCompanies = generateCompanies();

// Real vehicle data samples from the database
const realVehiclesData = [
  {
    make: 'Hyundai', model: 'Elantra', year: 2023, trim: 'SEL',
    vin: 'KMHLS4AG3PU613738', mileage: 17675, color: 'BLACK',
    damage_main: 'FRONT END', damage_secondary: '',
    est_value: 17675.00, repair_cost: 17675.00,
    engine: '2.0L', drive: 'front', transmission: 'auto',
    images: ["https://c-static.copart.com/v1/AUTH_svc.pdoc00001/ids-c-prod-lpp/0325/0138aa658c4345d6854cf9f283cef429_frames_0.jpg", "https://c-static.copart.com/v1/AUTH_svc.pdoc00001/ids-c-prod-lpp/0325/0138aa658c4345d6854cf9f283cef429_frames_1.jpg"]
  },
  {
    make: 'Ford', model: 'Explorer', year: 2017, trim: 'LIMITED',
    vin: '1FM5K8F83HGB81976', mileage: 14883, color: 'Black',
    damage_main: 'UNKNOWN', damage_secondary: '',
    est_value: 9699.00, repair_cost: 14883.00,
    engine: '3.5L', drive: 'full', transmission: 'auto',
    images: ["https://mediastorageaccountprod.blob.core.windows.net/media/42561742_VES-100_1"]
  },
  {
    make: 'Nissan', model: 'Pathfinder', year: 2014, trim: 'SL',
    vin: '5N1AR2MN2EC729856', mileage: 1000, color: 'Unknown',
    damage_main: 'UNKNOWN', damage_secondary: '',
    est_value: 0.00, repair_cost: 1000.00,
    engine: '3.5L', drive: 'front', transmission: 'auto',
    images: ["https://mediastorageaccountprod.blob.core.windows.net/media/42605820_VES-100_1"]
  },
  {
    make: 'Volkswagen', model: 'Taos', year: 2024, trim: '1.5T S',
    vin: '3VV5X7B23RM101795', mileage: 1000, color: 'Unknown',
    damage_main: 'UNKNOWN', damage_secondary: '',
    est_value: 0.00, repair_cost: 1000.00,
    engine: '1.5L', drive: 'front', transmission: 'auto',
    images: ["https://mediastorageaccountprod.blob.core.windows.net/media/42725454_VES-100_1"]
  },
  {
    make: 'Cadillac', model: 'CT6', year: 2017, trim: 'LUXURY',
    vin: '1G6KD5RS8HU157880', mileage: 72339, color: 'White',
    damage_main: 'FRONT END', damage_secondary: '',
    est_value: 0.00, repair_cost: 1000.00,
    engine: '3.6L', drive: 'full', transmission: 'auto',
    images: ["https://mediastorageaccountprod.blob.core.windows.net/media/42779400_VES-100_1"]
  },
  {
    make: 'Audi', model: 'A4', year: 2018, trim: 'PREMIUM PLUS',
    vin: 'WAUENAF46JA059280', mileage: 67098, color: 'BLACK',
    damage_main: 'REAR END', damage_secondary: 'TOP/ROOF',
    est_value: 17678.79, repair_cost: 19065.00,
    engine: '2.0L', drive: 'full', transmission: 'auto',
    images: ["https://c-static.copart.com/v1/AUTH_svc.pdoc00001/ids-c-prod-lpp/0725/08f19a1191114366a9907fa571f76a28_O.jpeg", "https://c-static.copart.com/v1/AUTH_svc.pdoc00001/ids-c-prod-lpp/0725/61c09914763644d88e8eb900f02dcdce_frames_0.jpg"]
  },
  {
    make: 'Toyota', model: 'Camry', year: 2024, trim: 'LE',
    vin: '4T1C11AK0RU216254', mileage: 28561, color: 'BLACK',
    damage_main: 'SIDE', damage_secondary: '',
    est_value: 17247.00, repair_cost: 22234.00,
    engine: '2.5L', drive: 'front', transmission: 'auto',
    images: ["https://c-static.copart.com/v1/AUTH_svc.pdoc00001/ids-c-prod-lpp/0725/61eacb94ef4f46cf913e4f28290cfeb3_O.jpeg", "https://c-static.copart.com/v1/AUTH_svc.pdoc00001/ids-c-prod-lpp/0725/5302299586ab447385f9c65dce9c3222_frames_0.jpg"]
  }
];

const generateVehicles = (targetCount = 40) => {
  const vehicles = [];
  const baseData = realVehiclesData;

  for (let i = 0; i < targetCount; i++) {
    // Cycle through real data or use faker
    const template = baseData[i % baseData.length];
    const isReal = i < baseData.length;

    // Basic fields
    const make = isReal ? template.make : faker.vehicle.manufacturer();
    const model = isReal ? template.model : faker.vehicle.model();
    const year = isReal ? template.year : faker.number.int({ min: 2012, max: 2024 });
    const mileage = isReal ? template.mileage : faker.number.int({ min: 5000, max: 200000 });

    // Derived/Complex fields
    const price = isReal ? template.est_value : faker.number.int({ min: 5000, max: 60000 });
    const retail_value = price > 0 ? price : faker.number.int({ min: 10000, max: 50000 });

    // Images
    const photos = isReal ? template.images.map((url, idx) => ({
      id: faker.number.int(),
      vehicle_id: i,
      url: url,
      thumb_url: url,
      thumb_url_min: url,
      thumb_url_middle: url
    })) : Array.from({ length: 5 }).map((_, idx) => {
      const url = `https://images.pexels.com/photos/${faker.helpers.arrayElement(['170811', '112460', '1235698', '210019'])}/pexels-photo-${faker.helpers.arrayElement(['170811', '112460'])}.jpeg?auto=compress&cs=tinysrgb&w=600`;
      return {
        id: faker.number.int(),
        vehicle_id: i,
        url,
        thumb_url: url,
        thumb_url_min: url,
        thumb_url_middle: url
      };
    });

    vehicles.push({
      id: (5000000000 + i).toString(), // Mimic large IDs from DB
      // Snake_case fields matching VehicleDetails interface
      make,
      model,
      year,
      mileage,
      vin: isReal ? template.vin : faker.vehicle.vin(),

      // Detailed specs
      trim: isReal ? template.trim : 'Base',
      engine_volume: isReal && template.engine ? parseFloat(template.engine) : 2.0,
      engine_fuel: 'petrol',
      transmission: isReal ? template.transmission : 'auto',
      drive: isReal ? template.drive : 'front',
      color: isReal ? template.color : faker.vehicle.color(),
      cylinders: '4',
      body_type: 'Sedan', // Approximate

      // Values
      retail_value,
      buy_it_now_price: faker.datatype.boolean() ? retail_value * 0.8 : null,
      repair_cost: isReal ? template.repair_cost : retail_value * 0.5,
      calc_price: faker.number.int({ min: 1000, max: 20000 }), // Current bid?

      // Status & Damage
      status: 'used',
      damage_main_damages: isReal ? template.damage_main : faker.helpers.arrayElement(['FRONT END', 'REAR END', 'SIDE', 'HAIL']),
      damage_secondary_damages: isReal ? template.damage_secondary : 'UNKNOWN',
      run_and_drive: 'Run & Drive Verified',
      has_keys: true,
      has_keys_readable: 'YES',
      airbags: 'intact',
      odometer_brand: 'ACTUAL',

      // Location
      source: 'IAAI',
      yard_name: `${faker.location.city()} (${faker.location.state({ abbreviated: true })})`,
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      country: 'USA',

      // Images
      primary_photo_url: photos[0].url,
      photos: photos,

      // Dates
      sold_at_date: faker.date.future().toISOString().split('T')[0],
      created_at: faker.date.past().toISOString(),
      updated_at: faker.date.recent().toISOString(),

      // Legacy camelCase for backward compatibility if needed
      price,
      imageUrl: photos[0].url,
      bodyType: 'Sedan',
      fuelType: 'Gasoline'
    });
  }

  return vehicles;
};

export const mockCars = generateVehicles(30);
export const mockVehicles = mockCars; // Alias

export const mockUser = {
  id: '1',
  name: faker.person.fullName(),
  email: faker.internet.email(),
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${faker.person.firstName()}`
};

// Navigation and Footer are now in client/src/config/navigation.ts


export const mockContent = {
  title: 'იმპორტირება აშშ-დან საქართველოში',
  subtitle: 'იპოვეთ სანდო კომპანიები ავტომობილების იმპორტისთვის',
  description: 'ჩვენი პლატფორმა დაგეხმარებათ იპოვოთ საუკეთესო კომპანიები ავტომობილების იმპორტისთვის აშშ-დან საქართველოში. ფართო არჩევანი, გამჭვირვალე ფასები და მაღალი რეიტინგი.',
  features: [
    {
      id: '1',
      title: 'სრული მომსახურება',
      description: 'დოკუმენტაციიდან მიწოდებამდე - ყველაფერი ერთ ადგილას'
    },
    {
      id: '2',
      title: 'გამოცდილი კომპანიები',
      description: 'მხოლოდ ვერიფიცირებული და რეიტინგული იმპორტიორები'
    },
    {
      id: '3',
      title: 'გამჭვირვალე ფასები',
      description: 'არცერთი დამალული გადასახადი ან საკომისიო'
    }
  ]
};

// Footer links are now in client/src/config/navigation.ts


export const mockSearchFilters = {
  geography: ['California', 'Texas', 'Florida', 'New York', 'Georgia'],
  services: ['Full Import Service', 'Documentation', 'Shipping', 'Customs Clearance', 'Vehicle Inspection'],
  priceRange: [1000, 10000],
  rating: 0,
  vipOnly: false
};

const generateRecentCases = (count = 3) => {
  const destinations = ['Tbilisi', 'Batumi', 'Poti', 'Kutaisi'];

  return Array.from({ length: count }, () => {
    const make = faker.vehicle.manufacturer();
    const model = faker.vehicle.model();
    const fromCity = faker.location.city();
    const toCity = faker.helpers.arrayElement(destinations);
    const days = faker.number.int({ min: 10, max: 35 });

    return {
      id: faker.string.uuid(),
      make,
      model,
      from: `USA (${fromCity})`,
      to: toCity,
      days,
      completedAt: faker.date.past({ years: 1 }).toISOString().split('T')[0]
    };
  });
};

export const mockRecentCases = generateRecentCases();
