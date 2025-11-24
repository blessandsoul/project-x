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
      rating: faker.number.int({ min: 1, max: 5 }),
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

    const ratingScore = (avgRating / 5) * 70;
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

// TODO-FX: Replace with real API call.
// API Endpoint: GET /api/companies
// Expected Data:
//   type: array
//   items:
//     type: object
//     properties:
//       id:
//         type: string
//         example: "1"
//       name:
//         type: string
//         example: "Premium Auto Import LLC"
//       logo:
//         type: string
//         format: uri
//       description:
//         type: string
//       services:
//         type: array
//         items:
//           type: string
//       priceRange:
//         type: object
//         properties:
//           min:
//             type: number
//           max:
//             type: number
//           currency:
//             type: string
//             example: "USD"
//       rating:
//         type: number
//         minimum: 0
//         maximum: 5
//       reviewCount:
//         type: integer
//       vipStatus:
//         type: boolean
//       location:
//         type: object
//         properties:
//           state:
//             type: string
//           city:
//             type: string
//       contact:
//         type: object
//         properties:
//           email:
//             type: string
//             format: email
//           phone:
//             type: string
//           website:
//             type: string
//             format: uri
//       establishedYear:
//         type: integer
//       reviews:
//         type: array
//         items:
//           type: object
//           properties:
//             id:
//               type: string
//             userName:
//               type: string
//             rating:
//               type: number
//               minimum: 1
//               maximum: 5
//             comment:
//               type: string
//             date:
//               type: string
//               format: date

function generateCars(companies, targetCount = 40) {
  const cars = [];

  const bodyTypes = ['Sedan', 'SUV', 'Coupe', 'Hatchback', 'Pickup', 'Wagon'];
  const fuelTypes = ['Gasoline', 'Diesel', 'Hybrid', 'Electric'];
  const transmissions = ['Automatic', 'Manual'];

  if (!Array.isArray(companies) || companies.length === 0) {
    return cars;
  }

  const companiesCount = companies.length;
  const basePerCompany = Math.max(1, Math.floor(targetCount / companiesCount));

  companies.forEach((company) => {
    const count = faker.number.int({ min: basePerCompany, max: basePerCompany + 1 });

    for (let i = 0; i < count; i += 1) {
      const make = faker.vehicle.manufacturer();
      const model = faker.vehicle.model();
      const year = faker.number.int({ min: 2010, max: 2024 });
      const price = faker.number.int({ min: 5000, max: 60000 });
      const mileage = faker.number.int({ min: 10000, max: 150000 });

      cars.push({
        id: faker.string.uuid(),
        companyId: company.id,
        make,
        model,
        year,
        price,
        mileage,
        imageUrl: `https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=600`,
        vin: faker.vehicle.vin(),
        bodyType: faker.helpers.arrayElement(bodyTypes),
        fuelType: faker.helpers.arrayElement(fuelTypes),
        transmission: faker.helpers.arrayElement(transmissions),
      });
    }
  });

  return cars.slice(0, targetCount);
}

export const mockCars = generateCars(mockCompanies);

export const mockUser = {
  id: '1',
  name: faker.person.fullName(),
  email: faker.internet.email(),
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${faker.person.firstName()}`
};

// TODO-FX: Replace with real API call.
// API Endpoint: GET /api/user/profile
// Expected Data:
//   type: object
//   properties:
//     id:
//       type: string
//     name:
//       type: string
//     email:
//       type: string
//       format: email
//     avatar:
//       type: string
//       format: uri

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

// TODO-FX: Replace with real API call.
// API Endpoint: GET /api/content/home
// Expected Data:
//   type: object
//   properties:
//     title:
//       type: string
//     subtitle:
//       type: string
//     description:
//       type: string
//     features:
//       type: array
//       items:
//         type: object
//         properties:
//           id:
//             type: string
//           title:
//             type: string
//           description:
//             type: string

// Footer links are now in client/src/config/navigation.ts


export const mockSearchFilters = {
  geography: ['California', 'Texas', 'Florida', 'New York', 'Georgia'],
  services: ['Full Import Service', 'Documentation', 'Shipping', 'Customs Clearance', 'Vehicle Inspection'],
  priceRange: [1000, 10000],
  rating: 0,
  vipOnly: false
};

// TODO-FX: Replace with real API call.
// API Endpoint: GET /api/search/filters
// Expected Data:
//   type: object
//   properties:
//     geography:
//       type: array
//       items:
//         type: string
//     services:
//       type: array
//       items:
//         type: string
//     priceRange:
//       type: array
//       items:
//         type: number
//       minItems: 2
//       maxItems: 2
//     rating:
//       type: number
//       minimum: 0
//       maximum: 5
//     vipOnly:
//       type: boolean

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

// TODO-FX: Replace with real API call.
// API Endpoint: GET /api/imports/recent-cases
// Expected Data:
//   type: array
//   items:
//     type: object
//     properties:
//       id:
//         type: string
//         example: "case-1"
//       make:
//         type: string
//         example: "BMW"
//       model:
//         type: string
//         example: "X5"
//       from:
//         type: string
//         example: "USA (New York)"
//       to:
//         type: string
//         example: "Batumi"
//       days:
//         type: integer
//         example: 12
//       completedAt:
//         type: string
//         format: date
//         example: "2024-05-12"
