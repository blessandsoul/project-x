import { useEffect, useState } from 'react'
import { fetchVehiclePhotos } from '@/api/vehicles'
import type { VehiclePhoto } from '@/types/vehicles'

interface UseVehiclePhotosMapOptions {
  vehicleIds: number[]
}

type PhotosMap = Record<number, string | null>

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
            const first = Array.isArray(photos) && (photos as VehiclePhoto[])[0]
            nextMap[id] = first ? first.thumb_url || first.url : null
          } catch {
            nextMap[id] = null
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
