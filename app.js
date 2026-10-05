import { API_KEY } from "./config.js";// Replace with your OpenWeatherMap API key

const city = document.getElementById("city-input");
const searchBtn = document.getElementById("search");
const statusdisplay = document.getElementById("status");
const result = document.getElementById("result");
const forecastList = document.getElementById("forecast");

// Reusable helper: fetch + check ok + parse JSON
const getJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Server error: ${response.status}`);
  return response.json();
};

const loadlastCity = () => {
    try{
        return localStorage.getItem("lastCity");
    } catch {
        return null;   // corrupted data or storage blocked
    }
};

const savelastCity = (name) => {
    try{
        localStorage.setItem("lastCity", name);
    } catch {
        // storage full or blocked: the app still works, it just won't save
    }   
}

const search = async () => {
    const cityName = city.value.trim();
    if (!cityName) {
        statusdisplay.textContent = "Please enter a city name.";
        return;
    }

    statusdisplay.textContent = "Loading...";
    result.textContent = "";
    searchBtn.disabled = true;

    try {
        const geo = await getJson(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${API_KEY}`
        );
        const place = geo[0];
        if (!place) {
            statusdisplay.textContent = `City ${cityName} not found.`;
            return;
        }
        const [weather, forecast] = await Promise.all([
            getJson(`https://api.openweathermap.org/data/2.5/weather?lat=${place.lat}&lon=${place.lon}&appid=${API_KEY}&units=metric`),
            getJson(`https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`)
        ]);
        const {temp} = weather.main;
        const {speed} = weather.wind;

        statusdisplay.textContent = "";
        result.textContent = `Weather in ${place.name}, ${place.country}: ${temp}°C, Wind Speed: ${speed} m/s`;

        const {time, temperature_2m_max, temperature_2m_min} = forecast.daily;
        forecastList.replaceChildren(...time.map((date, i) => {
            const li = document.createElement("li");
            li.textContent = `${date}: Max Temp: ${temperature_2m_max[i]}°C, Min Temp: ${temperature_2m_min[i]}°C`;
            return li;
        }));

        savelastCity(place.name);   
    }catch (error) {
        statusdisplay.textContent = `Error: ${error.message}`;
    } finally {
        searchBtn.disabled = false;
    }
};

searchBtn.addEventListener("click", search);

city.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        search();
    }
});

const lastCity = loadlastCity();
if (lastCity) {
    city.value = lastCity;
    search();
}
