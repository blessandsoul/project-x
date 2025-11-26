import type { TFunction } from 'i18next'
import type { VinDecodeSuccess } from '@/lib/vinApi'

export const VIN_PRIMARY_KEYS = [
  'make',
  'model',
  'model_year',
  'year',
  'trim',
  'series',
  'body_class',
  'vehicle_type',
] as const

export const VIN_SECONDARY_KEYS = [
  'engine_cylinders',
  'engine_displacement',
  'engine_model',
  'engine_power',
  'fuel_type',
  'transmission_style',
  'transmission_speeds',
  'drive_type',
  'doors',
  'gross_vehicle_weight_rating',
  'manufacturer',
  'plant_country',
  'plant_city',
  'plant_state',
] as const

export const formatVinFieldKey = (rawKey: string, t?: TFunction): string => {
  if (t) {
    // Try to find a translation for the exact key
    const key = rawKey.toLowerCase()
    // Map known keys to translation paths
    const translationMap: Record<string, string> = {
      'trim': 'vin.fields.trim',
      'series': 'vin.fields.series',
      'body_class': 'vin.fields.body_class',
      'vehicle_type': 'vin.fields.vehicle_type',
      'engine_cylinders': 'vin.fields.engine_cylinders',
      'engine_displacement': 'vin.fields.engine_displacement',
      'engine_model': 'vin.fields.engine_model',
      'engine_power': 'vin.fields.engine_power',
      'fuel_type': 'vin.fields.fuel_type',
      'transmission_style': 'vin.fields.transmission_style',
      'transmission_speeds': 'vin.fields.transmission_speeds',
      'drive_type': 'vin.fields.drive_type',
      'doors': 'vin.fields.doors',
      'gross_vehicle_weight_rating': 'vin.fields.gvwr',
      'manufacturer': 'vin.fields.manufacturer',
      'plant_country': 'vin.fields.plant_country',
      'plant_city': 'vin.fields.plant_city',
      'plant_state': 'vin.fields.plant_state',
    }
    
    if (translationMap[key]) {
        return t(translationMap[key])
    }
  }

  const withSpaces = rawKey
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')

  return withSpaces
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const formatVinFieldValue = (value: unknown): string => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (Array.isArray(value)) {
    const primitiveValues = value.filter(
      (item) =>
        item === null ||
        item === undefined ||
        typeof item === 'string' ||
        typeof item === 'number' ||
        typeof item === 'boolean',
    )

    if (primitiveValues.length > 0) {
      return primitiveValues
        .map((item) => (item === null || item === undefined ? '-' : String(item)))
        .join(', ')
    }

    return JSON.stringify(value)
  }

  if (typeof value === 'object') {
    const plainObject = value as Record<string, unknown>
    const values = Object.values(plainObject)

    if (values.length > 0) {
      const primitiveValues = values.filter(
        (item) =>
          item === null ||
          item === undefined ||
          typeof item === 'string' ||
          typeof item === 'number' ||
          typeof item === 'boolean',
      )

      if (primitiveValues.length > 0) {
        return primitiveValues
          .map((item) => (item === null || item === undefined ? '-' : String(item)))
          .join(', ')
      }
    }

    return JSON.stringify(value)
  }

  return String(value)
}

export const getOrderedVinEntries = (
  data: VinDecodeSuccess['data'] | undefined,
): Array<[string, unknown]> => {
  if (!data) return []

  const entries = Object.entries(data)
  if (entries.length === 0) return []

  const primaryPriority = new Map<string, number>()
  VIN_PRIMARY_KEYS.forEach((key, index) => {
    primaryPriority.set(key, index)
  })

  const secondaryPriority = new Map<string, number>()
  VIN_SECONDARY_KEYS.forEach((key, index) => {
    secondaryPriority.set(key, index)
  })

  return entries
    .slice()
    .sort((a, b) => {
      const keyA = a[0].toLowerCase()
      const keyB = b[0].toLowerCase()

      const isPrimaryA = primaryPriority.has(keyA)
      const isPrimaryB = primaryPriority.has(keyB)
      const isSecondaryA = secondaryPriority.has(keyA)
      const isSecondaryB = secondaryPriority.has(keyB)

      if (isPrimaryA && !isPrimaryB) return -1
      if (!isPrimaryA && isPrimaryB) return 1

      if (isSecondaryA && !isSecondaryB) return -1
      if (!isSecondaryA && isSecondaryB) return 1

      if (isPrimaryA && isPrimaryB) {
        return (primaryPriority.get(keyA) ?? 0) - (primaryPriority.get(keyB) ?? 0)
      }

      if (isSecondaryA && isSecondaryB) {
        return (secondaryPriority.get(keyA) ?? 0) - (secondaryPriority.get(keyB) ?? 0)
      }

      return keyA.localeCompare(keyB)
    })
}
