from fastapi import FastAPI, HTTPException, Query
from dotenv import load_dotenv
import httpx
import os
from datetime import datetime, timezone
import math

load_dotenv()

app = FastAPI(
    title="NightWatch API",
    description="Real-time stargazing conditions for any location",
    version="1.0.0"
)

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
USE_MOCK = os.getenv("USE_MOCK", "false").lower() == "true"

_MOCK_WEATHER = {
    "cloud_cover": 15,
    "humidity": 40,
    "wind_speed": 8.0,      # already in km/h
    "temperature": 22.0,
    "visibility": 9.5,      # already in km
    "precipitation": 0.0
}

_OPENWEATHER_ERRORS = {
    401: (401, "Invalid or missing OpenWeather API key"),
    404: (404, "Location not found"),
    429: (429, "OpenWeather API rate limit exceeded"),
    400: (400, "Bad request sent to weather service"),
}

async def _fetch_weather(lat: float, lon: float) -> dict:
    """Fetch weather from OWM, or return mock data if USE_MOCK=true."""
    if USE_MOCK:
        return _MOCK_WEATHER

    if not OPENWEATHER_API_KEY:
        raise HTTPException(status_code=500, detail="Server is missing the OpenWeather API key")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": OPENWEATHER_API_KEY,
                    "units": "metric"
                },
                timeout=10.0
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Weather service timed out")
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Could not reach weather service")

    if response.status_code != 200:
        status, detail = _OPENWEATHER_ERRORS.get(
            response.status_code,
            (502, f"Weather service returned an unexpected error ({response.status_code})")
        )
        raise HTTPException(status_code=status, detail=detail)

    data = response.json()

    try:
        return {
            "cloud_cover": data["clouds"]["all"],
            "humidity": data["main"]["humidity"],
            "wind_speed": data["wind"]["speed"] * 3.6,  # m/s → km/h
            "temperature": data["main"]["temp"],
            "visibility": data.get("visibility", 10000) / 1000,  # m → km
            "precipitation": data.get("rain", {}).get("1h", 0)
        }
    except KeyError:
        raise HTTPException(status_code=502, detail="Unexpected response format from weather service")


@app.get("/score")
async def get_score(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude")
):
    w = await _fetch_weather(lat, lon)

    score = 10
    score -= (w["cloud_cover"] / 100) * 4
    score -= (w["humidity"] / 100) * 1.5
    score -= min(w["wind_speed"] / 50, 1) * 1.5
    score -= min(w["precipitation"] * 2, 3)
    score -= max(0, (10 - w["visibility"]) / 10) * 1.5
    score = round(max(0, min(10, score)), 1)

    return {
        "score": score,
        "conditions": {
            "temperature": w["temperature"],
            "humidity": w["humidity"],
            "cloud_cover": w["cloud_cover"],
            "wind_speed": round(w["wind_speed"], 1),
            "precipitation": w["precipitation"],
            "visibility": w["visibility"],
        },
        "message": f"Stargazing score for ({lat}, {lon}) is {score}/10"

    }
@app.get("/moonphase")
async def get_moonphase():
    # Days since a known new moon (Jan 6, 2000 at 18:14 UTC)
    known_new_moon = datetime(2000, 1, 6, 18, 14, tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    days_since = (now - known_new_moon).total_seconds() / 86400

    lunar_cycle = 29.53059  # days
    phase = (days_since % lunar_cycle) / lunar_cycle  # 0.0 to 1.0

    # Illumination: 0% at new moon, 100% at full moon
    illumination = round((1 - math.cos(2 * math.pi * phase)) / 2 * 100, 1)

    # Phase name
    if phase < 0.0625 or phase >= 0.9375:
        name = "New Moon"
    elif phase < 0.1875:
        name = "Waxing Crescent"
    elif phase < 0.3125:
        name = "First Quarter"
    elif phase < 0.4375:
        name = "Waxing Gibbous"
    elif phase < 0.5625:
        name = "Full Moon"
    elif phase < 0.6875:
        name = "Waning Gibbous"
    elif phase < 0.8125:
        name = "Last Quarter"
    else:
        name = "Waning Crescent"

    return {
        "phase_name": name,
        "illumination_percent": illumination,
        "phase_cycle": round(phase, 4),  # 0.0 = new moon, 0.5 = full moon
    }