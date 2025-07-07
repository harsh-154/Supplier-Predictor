from math import radians, sin, cos, sqrt, atan2
import requests
import os
from dotenv import load_dotenv

load_dotenv()

OPENWEATHER_API = os.getenv("OPENWEATHER_API")
ACLED_API_TOKEN = os.getenv("ACLED_API_KEY")

def fetch_weather_risk(lat, lon):
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API}"
        res = requests.get(url).json()
        main = res['weather'][0]['main']
        if main in ["Thunderstorm", "Extreme", "Tornado"]:
            return 0.9
        elif main in ["Rain", "Snow"]:
            return 0.6
        elif main == "Clouds":
            return 0.3
        else:
            return 0.1
    except:
        return 0.3

def fetch_war_risk(country):
    try:
        url = f"https://api.acleddata.com/acled/read?country={country}&event_date=LAST30DAYS&limit=1"
        headers = {"Authorization": f"Token {ACLED_API_TOKEN}"}
        res = requests.get(url, headers=headers).json()
        count = int(res.get("count", 0))
        return min(1.0, count / 10.0)
    except:
        return 0.2

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))
