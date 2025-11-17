import { useEffect, useState } from 'react'
import { fetchVehiclePhotos } from '@/api/vehicles'
import type { VehiclePhoto } from '@/types/vehicles'

interface UseVehiclePhotosMapOptions {
  vehicleIds: number[]
}

type PhotosMap = Record<number, string[]>

export function useVehiclePhotosMap({ vehicleIds }: UseVehiclePhotosMapOptions): PhotosMap {
  const [photosMap, setPhotosMap] = useState<PhotosMap>({})

  useEffect(() => {
    if (!vehicleIds.length) {
      return
    }

    let isMounted = true

    const uniqueIds = Array.from(new Set(vehicleIds))

    const load = async () => {
      const nextMap: PhotosMap = {}

      await Promise.all(
        uniqueIds.map(async (id) => {
          try {
            const photos = await fetchVehiclePhotos(id)
            const list = Array.isArray(photos) ? (photos as VehiclePhoto[]) : []
            nextMap[id] = list
              .map((photo) => photo.thumb_url || photo.url || photo.thumb_url_middle)
              .filter((url): url is string => Boolean(url))
          } catch {
            nextMap[id] = []
          }
        }),
      )

      if (!isMounted) return
      setPhotosMap(nextMap)
    }

    load()

    return () => {
      isMounted = false
    }
  }, [vehicleIds.join(',')])

  return photosMap
}
