export interface PositionGps {
  latitude: number;
  longitude: number;
  /** Radius in metres within which the real position lies. */
  precision: number;
}

/** Reads the phone's GPS position once (F-CLI-03, no map key needed). */
export function lirePositionGps(): Promise<PositionGps> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('La localisation n’est pas disponible sur cet appareil.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          precision: Math.round(position.coords.accuracy),
        }),
      (error) =>
        reject(
          new Error(
            error.code === error.PERMISSION_DENIED
              ? 'Autorisez la localisation pour ChapExpress dans les réglages du navigateur.'
              : 'Position introuvable. Réessayez à l’extérieur ou près d’une fenêtre.',
          ),
        ),
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 60_000 },
    );
  });
}

export function lienGoogleMaps(latitude: number | string, longitude: number | string): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}
