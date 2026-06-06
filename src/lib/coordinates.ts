export function toGeoPoint(lat: number, lng: number) {
  return {
    lat,
    lng,
    type: 'Point' as const,
    coordinates: [lng, lat],
  };
}

export function fromPin(pin: any) {
  if (!pin?.coordinates) return { lat: undefined, lng: undefined };

  const lat = pin.coordinates.lat ?? pin.coordinates.coordinates?.[1];
  const lng = pin.coordinates.lng ?? pin.coordinates.coordinates?.[0];

  // Возвращаем undefined для невалидных чисел
  if (lat === undefined || lat === null || isNaN(Number(lat))) return { lat: undefined, lng: undefined };
  if (lng === undefined || lng === null || isNaN(Number(lng))) return { lat: undefined, lng: undefined };

  return { lat: Number(lat), lng: Number(lng) };
}
