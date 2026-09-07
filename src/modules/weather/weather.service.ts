import { AppError } from '../../common/AppError'; import { HttpStatus } from '../../common/http-status';
export class WeatherService {
  async forecast(latitude: number, longitude: number, days: number) {
    const baseUrl = process.env.WEATHER_API_URL || 'https://api.open-meteo.com/v1/forecast';
    const url = new URL(baseUrl); url.searchParams.set('latitude', String(latitude)); url.searchParams.set('longitude', String(longitude)); url.searchParams.set('forecast_days', String(days)); url.searchParams.set('timezone', 'auto'); url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m'); url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max');
    try { const response = await fetch(url, { signal: AbortSignal.timeout(8000) }); if (!response.ok) throw new Error(`Weather provider returned ${response.status}`); return await response.json(); } catch (error) { throw new AppError('Weather data is temporarily unavailable.', HttpStatus.INTERNAL_SERVER_ERROR); }
  }
}
