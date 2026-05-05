from fastapi import FastAPI, HTTPException, Query
from dotenv import load_dotenv
import httpx
import os

load_dotenv()

app = FastAPI(
    title="NightWatch API",
    description="Real-time stargazing conditions for any location",
    version="1.0.0"
)

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

_OPENWEATHER_ERRORS = {
    401: (401, "Invalid or missing OpenWeather API key"),
    404: (404, "Location not found"),
    429: (429, "OpenWeather API rate limit exceeded"),
    400: (400, "Bad request sent to weather service"),
}

@app.get("/score")
async def get_score(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude")
):
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

    cloud_cover = data["clouds"]["all"]
    humidity = data["main"]["humidity"]
    wind_speed = data["wind"]["speed"] * 3.6
    temperature = data["main"]["temp"]
    visibility = data.get("visibility", 10000) / 1000
    precipitation = data.get("rain", {}).get("1h", 0)

    score = 10
    score -= (cloud_cover / 100) * 4
    score -= (humidity / 100) * 1.5
    score -= min(wind_speed / 50, 1) * 1.5
    score -= min(precipitation * 2, 3)
    score = round(max(0, min(10, score)), 1)

    return {
        "score": score,
        "conditions": {
            "temperature": temperature,
            "humidity": humidity,
            "cloud_cover": cloud_cover,
            "wind_speed": round(wind_speed, 1),
            "precipitation": precipitation,
            "visibility": visibility,
        },
        "message": f"Stargazing score for ({lat}, {lon}) is {score}/10"
    }