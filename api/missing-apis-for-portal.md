# TrustedImporters.Ge – Missing APIs to Replace Mock Data

## Цель документа

Фронтенд приложения сейчас частично работает на `mocks/_mockData`.  
Этот документ описывает **API, которых сейчас нет в backend-доках**, но которые нужны, чтобы:

- полностью перейти с мок-данных на реальные;
- синхронизировать поведение портала (Home, Search, Catalog, Company Profile, Dashboard, Auctions) с backend.

Документ НЕ включает уже реализованные эндпоинты (`/vehicles/*`, `/companies`, `/login`, `/profile`, `/api/vin/*` и т.п.), а только новые/отсутствующие.

---

## 1. Контент и навигация портала

### 1.1. GET `/api/navigation`

**Сейчас**

- Фронтенд использует конфигурацию из `client/src/config/navigation.ts` (ранее `mockNavigationItems` из `client/src/mocks/_mockData.js`) для Header на всех страницах.

**Задача**

- Отдавать конфигурацию главного меню (id, текст, URL) из backend.

**Запрос**

- `GET /api/navigation`

**Ответ (200)**

```jsonc
[
  {
    "id": "home",
    "label": "მთავარი",
    "href": "/"
  },
  {
    "id": "search",
    "label": "ძებნა",
    "href": "/search"
  },
  {
    "id": "catalog",
    "label": "კატალოგი",
    "href": "/catalog"
  },
  {
    "id": "dashboard",
    "label": "დაფა",
    "href": "/dashboard"
  },
  {
    "id": "logisticsRadar",
    "label": "ლოგისტიკის რადარი",
    "href": "/logistics-radar"
  },
  {
    "id": "auctionListings",
    "label": "აქტიური აუქციონები",
    "href": "/auction-listings"
  },
  {
    "id": "carfax",
    "label": "VIN შემოწმება",
    "href": "/vin"
  }
]
```

**Используется фронтендом**

- `Header`, все страницы (`HomePage`, `AuctionListingsPage`, `CompanySearchPage`, `CompanyCatalogPage`, `DashboardPage`, `CarfaxPage`, `LogisticsRadarPage` и т.д.).

---

### 1.2. GET `/api/content/home`

**Сейчас**

- Контент главной страницы (заголовки, описание, список фич) берётся из `mockContent` в `_mockData.js`.

**Задача**

- Вынести текстовый контент главной в API (подготовка к CMS).

**Запрос**

- `GET /api/content/home`

**Ответ (200)**

```jsonc
{
  "title": "იმპორტირება აშშ-დან საქართველოში",
  "subtitle": "იპოვეთ სანდო კომპანიები ავტომობილების იმპორტისთვის",
  "description": "ჩვენი პლატფორმა დაგეხმარებათ იპოვოთ საუკეთესო კომპანიები...",
  "features": [
    {
      "id": "1",
      "title": "სრული მომსახურება",
      "description": "დოკუმენტაციიდან მიწოდებამდე - ყველაფერი ერთ ადგილას"
    },
    {
      "id": "2",
      "title": "გამოცდილი კომპანიები",
      "description": "მხოლოდ ვერიფიცირებული და რეიტინგული იმპორტიორები"
    },
    {
      "id": "3",
      "title": "გამჭვირვალე ფასები",
      "description": "არცერთი დამალული გადასახადი ან საკომისიო"
    }
  ]
}
```

**Используется**

- `HomePage` и блоки в `components/home/*` (Hero / Features).

---

### 1.3. GET `/api/footer/links`

**Сейчас**

- `footerLinks` из `client/src/config/navigation.ts` (ранее `mockFooterLinks` в `_mockData.js`) используются в `Footer` на всех страницах.

**Задача**

- Хранить ссылки подвала на backend.

**Запрос**

- `GET /api/footer/links`

**Ответ (200)**

```jsonc
[
  { "id": "privacy", "label": "კონფიდენციალურობა", "href": "/privacy" },
  { "id": "terms", "label": "წესები", "href": "/terms" },
  { "id": "support", "label": "დახმარება", "href": "/support" }
]
```

---

## 2. Фильтры для поиска компаний

### 2.1. GET `/api/search/filters`

**Сейчас**

- Дефолтные фильтры берём из `mockSearchFilters` в `_mockData.js`:
  - `geography[]` (штаты),
  - `services[]`,
  - `priceRange: [min, max]`,
  - `rating`,
  - `vipOnly`.

- Используются:
  - `useCompanySearch` (initial state),
  - `CompanySearchPage`, `CompanyCatalogPage`,
  - home-блоки: `QuickSearchSection`, `PriceCalculatorSection`, `AudienceSegmentationSection`, `ReadyScenariosSection`,
  - `services/companiesApi.ts` (подмешивание штатов/услуг к компаниям).

**Задача**

- Отдавать “дефолтный фильтр + справочники” для поиска по компаниям.

**Запрос**

- `GET /api/search/filters`

**Ответ (200)**

```jsonc
{
  "geography": ["California", "Texas", "Florida", "New York", "Georgia"],
  "services": [
    "Full Import Service",
    "Documentation",
    "Shipping",
    "Customs Clearance",
    "Vehicle Inspection"
  ],
  "priceRange": [1000, 10000],
  "rating": 0,
  "vipOnly": false
}
```

---

## 3. Кейсы по импорту и примеры авто

### 3.1. GET `/api/imports/recent-cases`

**Сейчас**

- `mockRecentCases` в `_mockData.js`.
- Используется в нижнем блоке на `AuctionListingsPage` – "ბოლო წარმატებული იმპორტის მაგალითები".

**Задача**

- Показать пользователю реальные примеры успешного импорта.

**Запрос**

- `GET /api/imports/recent-cases`

**Ответ (200)**

```jsonc
[
  {
    "id": "case-1",
    "make": "BMW",
    "model": "X5",
    "from": "USA (New York)",
    "to": "Batumi",
    "days": 12,
    "completedAt": "2024-05-12"
  }
]
```

---

### 3.2. GET `/companies/:companyId/imported-cars`

**Сейчас**

- `mockCars` (генерируются из `mockCompanies`) используются в `CompanyProfilePage` в блоке "იმპორტირებული ავტომობილების მაგალითები".

**Задача**

- Для конкретной компании вернуть примеры уже импортированных машин.

**Запрос**

- `GET /companies/:companyId/imported-cars`

**Ответ (200)**

```jsonc
[
  {
    "id": "car-uuid",
    "companyId": "1",
    "make": "Toyota",
    "model": "Camry",
    "year": 2018,
    "price": 15000,
    "mileage": 85000,
    "imageUrl": "https://…",
    "vin": "1HGCM82633A004352",
    "bodyType": "Sedan",
    "fuelType": "Gasoline",
    "transmission": "Automatic"
  }
]
```

---

## 4. Отзывы о компаниях (reviews)

### 4.1. GET `/companies/:companyId/reviews`

**Сейчас**

- Отзывы зашиты в `mockCompanies[].reviews`:
  - `CompanyProfilePage` – секция "შეფასებები ({company.reviews.length})".
  - `TestimonialsSection` – собирает отзывы из всех компаний для блока на главной.

**В `companies-api.md` нет API для отзывов**, только информация о ценах и social links.

**Задача**

- Вернуть список отзывов по компании.

**Запрос**

- `GET /companies/:companyId/reviews`

**Ответ (200)**

```jsonc
[
  {
    "id": "rev-1",
    "userName": "John Doe",
    "rating": 5,
    "comment": "Everything went smoothly",
    "date": "2024-10-01"
  }
]
```

---

### 4.2. POST `/companies/:companyId/reviews` (опционально)

**Задача (если планируется добавление отзывов с фронта):**

- Позволить пользователям оставлять отзыв через UI.

**Запрос**

- `POST /companies/:companyId/reviews`

```jsonc
{
  "rating": 5,
  "comment": "Text of review",
  "userName": "optional if берём из профиля"
}
```

**Ответ (201)**

```jsonc
{
  "id": "rev-uuid",
  "userName": "John Doe",
  "rating": 5,
  "comment": "Text of review",
  "date": "2024-10-01"
}
```

---

## 5. Расширение существующих Companies API (не новые маршруты, а поля)

Сейчас фронтенд получает компании так:

- `GET /companies` → `services/companiesApi.ts → mapApiCompanyToUiCompany()`  
  и искусственно подмешивает:

  - `rating = 0`
  - `reviewCount = 0`
  - `vipStatus = false`
  - `location.state` / `location.city` — взяты из `mockSearchFilters.geography` и захардкожен `city: "Tbilisi"`.
  - `services[]` — берётся из `mockSearchFilters.services`.

Чтобы убрать эту Client-side логику и приблизиться к структуре `mockCompanies`:

### 5.1. Расширить ответ `GET /companies` и `GET /companies/:id`

**Рекомендуемые дополнительные поля в payload:**

```jsonc
{
  "id": 1,
  "name": "Premium Auto Import LLC",
  "logo": "https://...",
  "description": "…",
  "phone_number": "+995...",
  "base_price": 500,
  "price_per_mile": 0.5,
  "customs_fee": 300,
  "service_fee": 200,
  "broker_fee": 150,

  "rating": 4.6,
  "reviewCount": 32,
  "vipStatus": true,

  "location": {
    "state": "California",
    "city": "Los Angeles"
  },

  "services": [
    "Full Import Service",
    "Documentation",
    "Shipping"
  ],

  "priceRange": {
    "min": 1500,
    "max": 3500,
    "currency": "USD"
  }
}
```

**Используется фронтендом**

- `CompanySearchPage`, `CompanyCatalogPage`, `CompanyProfilePage`, блоки на главной (FeaturedCompanies, CompanyCompareSection, TestimonialsSection и т.п.).

---

## 6. Краткий итог

**Новые эндпоинты, которые нужно добавить:**

1. `GET /api/navigation`  
2. `GET /api/content/home`  
3. `GET /api/footer/links`  
4. `GET /api/search/filters`  
5. `GET /api/imports/recent-cases`  
6. `GET /companies/:companyId/imported-cars`  
7. `GET /companies/:companyId/reviews`  
8. *(опционально)* `POST /companies/:companyId/reviews`

**Расширения для уже существующих:**

- `GET /companies`
- `GET /companies/:id`

Дополнительно вернуть: `rating`, `reviewCount`, `vipStatus`, `location`, `services`, `priceRange` (min/max/currency).

Этот список покрывает все места, где фронтенд до сих пор использует `mocks/_mockData`, и позволяет перевести портал на реальные данные backend без изменения UX.
