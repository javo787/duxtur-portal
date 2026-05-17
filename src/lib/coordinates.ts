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

  return {
    lat: pin.coordinates.lat ?? pin.coordinates.coordinates?.[1],
    lng: pin.coordinates.lng ?? pin.coordinates.coordinates?.[0],
  };
}
