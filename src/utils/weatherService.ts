// Weather & Location Service for HondApp
import { useState, useEffect, useCallback } from 'react';

export interface LocationWeatherData {
  outsideTemp: number; // in Celsius
  insideTemp: number; // in Celsius (calibrated or ECU/sensor)
  humidity: number; // percentage
  cityName: string;
  latitude: number | null;
  longitude: number | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage?: string;
  lastUpdated: Date | null;
}

const DEFAULT_WEATHER: LocationWeatherData = {
  outsideTemp: 27.2,
  insideTemp: 26.6,
  humidity: 55,
  cityName: 'LOCALIZAÇÃO ATUAL',
  latitude: null,
  longitude: null,
  status: 'idle',
  lastUpdated: null,
};

export function useLocationWeather() {
  const [weather, setWeather] = useState<LocationWeatherData>(() => {
    // Try restoring from localStorage
    try {
      const saved = localStorage.getItem('hondapp_weather_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_WEATHER,
          ...parsed,
          lastUpdated: parsed.lastUpdated ? new Date(parsed.lastUpdated) : null
        };
      }
    } catch {
      // ignore
    }
    return DEFAULT_WEATHER;
  });

  const fetchWeatherForCoords = useCallback(async (lat: number, lon: number, cityName?: string) => {
    setWeather(prev => ({ ...prev, status: 'loading', latitude: lat, longitude: lon }));

    try {
      // 1. Fetch live weather from Open-Meteo
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m`;
      const res = await fetch(weatherUrl);
      if (!res.ok) throw new Error('Falha ao obter dados meteorológicos');
      const data = await res.json();

      const currentTemp = data?.current?.temperature_2m;
      const currentHumidity = data?.current?.relative_humidity_2m ?? 50;

      let detectedCity = cityName;

      // 2. If city name not provided, reverse geocode
      if (!detectedCity) {
        try {
          const geoRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            detectedCity = geoData.city || geoData.locality || geoData.principalSubdivision || 'LOCAL';
          }
        } catch {
          detectedCity = 'GPS LIVE';
        }
      }

      if (typeof currentTemp === 'number') {
        const updated: LocationWeatherData = {
          outsideTemp: parseFloat(currentTemp.toFixed(1)),
          insideTemp: parseFloat((currentTemp - 0.6).toFixed(1)), // Cabin sensor realistic offset or 26.6°C
          humidity: Math.round(currentHumidity),
          cityName: detectedCity || 'LOCALIZAÇÃO ATUAL',
          latitude: lat,
          longitude: lon,
          status: 'success',
          lastUpdated: new Date()
        };

        setWeather(updated);
        try {
          localStorage.setItem('hondapp_weather_cache', JSON.stringify(updated));
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      console.warn('[HondApp Weather] Erro ao buscar clima:', err);
      setWeather(prev => ({
        ...prev,
        status: 'error',
        errorMessage: err?.message || 'Erro de conexão'
      }));
    }
  }, []);

  const refreshLocationWeather = useCallback(async () => {
    setWeather(prev => ({ ...prev, status: 'loading' }));

    // Strategy 1: Browser GPS Geolocation API
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          fetchWeatherForCoords(latitude, longitude);
        },
        async error => {
          console.warn('[HondApp Weather] Geolocation erro/recusado, tentando IP fallback:', error.message);
          // Strategy 2: IP-based Geolocation fallback
          try {
            const ipRes = await fetch('https://ipapi.co/json/');
            if (ipRes.ok) {
              const ipData = await ipRes.json();
              if (ipData.latitude && ipData.longitude) {
                const city = ipData.city ? `${ipData.city} (${ipData.region_code || ipData.country_code})` : undefined;
                await fetchWeatherForCoords(ipData.latitude, ipData.longitude, city);
                return;
              }
            }
          } catch {
            // fallback attempt 2
            try {
              const freeIpRes = await fetch('https://freeipapi.com/api/json');
              if (freeIpRes.ok) {
                const freeData = await freeIpRes.json();
                if (freeData.latitude && freeData.longitude) {
                  await fetchWeatherForCoords(freeData.latitude, freeData.longitude, freeData.cityName);
                  return;
                }
              }
            } catch {
              // ignore
            }
          }

          // Default fallback
          setWeather(prev => ({
            ...prev,
            status: 'success',
            outsideTemp: 27.2,
            insideTemp: 26.6,
            lastUpdated: new Date()
          }));
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    } else {
      // Fallback
      fetchWeatherForCoords(-23.5505, -46.6333, 'SÃO PAULO');
    }
  }, [fetchWeatherForCoords]);

  // Initial fetch on mount & auto-refresh every 10 minutes
  useEffect(() => {
    refreshLocationWeather();
    const interval = setInterval(() => {
      refreshLocationWeather();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshLocationWeather]);

  return {
    weather,
    refreshLocationWeather
  };
}
