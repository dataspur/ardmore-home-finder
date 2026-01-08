import { useState, useCallback } from "react";

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export const useGeolocation = () => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLoading(false);
        setPermissionDenied(false);
      },
      (err) => {
        if (err.code === 1) {
          setPermissionDenied(true);
          setError("Location access denied. Please enable location in your browser settings.");
        } else if (err.code === 2) {
          setError("Unable to determine your location. Please try again.");
        } else if (err.code === 3) {
          setError("Location request timed out. Please try again.");
        } else {
          setError(err.message);
        }
        setLoading(false);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000,
        maximumAge: 300000 // Cache location for 5 minutes
      }
    );
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  return { 
    location, 
    error, 
    loading, 
    permissionDenied, 
    requestLocation,
    clearLocation 
  };
};
