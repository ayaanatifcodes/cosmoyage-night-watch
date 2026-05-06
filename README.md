# NightWatch By Cosmoyage

NightWatch is the external stargazing conditions API powering the light pollution dashboard for [Cosmoyage](https://github.com/ayaanatifcodes/cosmoyage-night-watch). It scores real-time sky conditions by location using live weather data, giving astronomers and stargazers a single number that tells them whether tonight is worth going out.

> This project is currently in active development and not yet production ready.

---

## What It Does

Given a latitude and longitude, NightWatch fetches live weather data and returns a stargazing score from 0 to 10. The score factors in cloud cover, humidity, wind speed, precipitation, and visibility. It is designed to serve as the conditions layer inside the Cosmoyage platform.

---

## Stack

| Layer | Technology |
|---|---|
| API Framework | FastAPI |
| HTTP Client | httpx (async) |
| Weather Data | OpenWeatherMap API |
| Containerization | Docker |
| Frontend | React |
| Geospatial | GeoPandas |
| Testing | Postman |
| Deployment | Vercel |

---

## Endpoints

**`GET /score`**
Returns a stargazing score and full conditions breakdown for a given coordinate.

Parameters:
- `lat` — latitude between -90 and 90
- `lon` — longitude between -180 and 180

Example response:
```json
{
  "score": 7.4,
  "conditions": {
    "temperature": 18.2,
    "humidity": 45,
    "cloud_cover": 20,
    "wind_speed": 12.5,
    "precipitation": 0,
    "visibility": 10.0
  },
  "message": "Stargazing score for (33.72, 73.04) is 7.4/10"
}
```

**`GET /moonphase`** *(coming soon)*
Returns the current moon phase and illumination percentage for a given coordinate. Uses the `ephem` library and requires no external API key.

---

## Scoring Formula

The score starts at 10 and deductions are applied based on conditions:

| Factor | Max Deduction | Notes |
|---|---|---|
| Cloud cover | 4.0 | Largest factor |
| Precipitation | 3.0 | Capped at heavy rain |
| Humidity | 1.5 | Affects atmospheric haze |
| Wind speed | 1.5 | Capped at 50 km/h |

A score of 10 means ideal conditions. A score of 0 means do not bother.

---

## Getting Started

**Prerequisites**
- Python 3.10+
- An OpenWeatherMap API key (free tier works)
- Docker (for containerized setup)

**Installation**

```bash
git clone https://github.com/ayaanatifcodes/cosmoyage-night-watch
cd cosmoyage-night-watch
pip install fastapi uvicorn httpx python-dotenv
```

**Environment setup**

Create a `.env` file in the root directory:

```
OPENWEATHER_API_KEY=your_key_here
USE_MOCK=false
```

Set `USE_MOCK=true` during development if your API key is not yet activated. The server will return realistic dummy data instead of hitting the live API.

**Running the server**

```bash
uvicorn api.main:app --reload
```

Visit `http://localhost:8000/docs` for the interactive Swagger UI.

---

## Project Structure

```
cosmoyage-night-watch/
  api/
    main.py
  frontend/
  tests/
  docs/
    openapi.yaml
  .env
  .gitignore
  README.md
```

---

## Roadmap

- [x] Project structure and OpenAPI spec
- [x] `/score` endpoint with live OWM data
- [x] Scoring formula and error handling
- [ ] Mock weather fallback for development
- [ ] `/moonphase` endpoint
- [ ] Dockerfile and docker-compose setup
- [ ] Frontend dashboard (React)
- [ ] Geospatial light pollution overlay (GeoPandas)
- [ ] Deployment to Vercel

---

## Part of Cosmoyage

NightWatch is built as a standalone API but is intended to serve as the live conditions and light pollution layer inside Cosmoyage, a broader platform for amateur astronomy in not only Pakistan but around the world.

---

## License

Not yet decided.
