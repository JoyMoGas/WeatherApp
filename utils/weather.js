import { getWeatherByCity, getForecastByCity } from "./api.js";

const inputElement = document.getElementById("citySearch");

inputElement.addEventListener("keypress", async (e) => {
  if (e.key === "Enter") {
    const cityName = inputElement.value.trim();

    if (cityName) {
      console.log("Buscando clima para:", cityName);
      const weatherData = await getWeatherByCity(cityName);
      const forecastData = await getForecastByCity(cityName);

      if (weatherData) {
        updateWeatherUI(weatherData);
      } else {
        console.log("No se encontró la ciudad");
      }

      if (forecastData) {
        updateForecastUI(forecastData);
      }
    }
  }
});

const currentDate = new Date();
const formattedDate = currentDate.toLocaleDateString("es", {
  weekday: "short",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const dateElement = document.getElementById("currentDate");
if (dateElement) {
  const capitalizedDate = capitalizeFirstLetter(formattedDate);
  dateElement.textContent = capitalizedDate;
}

function getWeatherIcon(weatherMain) {
  const iconMap = {
    Clear: "fa-sun",
    Clouds: "fa-cloud",
    Rain: "fa-cloud-rain",
    Drizzle: "fa-cloud-rain",
    Thunderstorm: "fa-cloud-bolt",
    Snow: "fa-snowflake",
    Mist: "fa-smog",
    Smoke: "fa-smog",
    Haze: "fa-smog",
    Dust: "fa-smog",
    Fog: "fa-smog",
    Sand: "fa-smog",
    Ash: "fa-smog",
    Squall: "fa-wind",
    Tornado: "fa-tornado",
  };

  return iconMap[weatherMain] || "fa-cloud-sun";
}

function processForecastData(forecastData) {
  if (!forecastData || !forecastData.list) return [];

  const dailyData = {};

  forecastData.list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toLocaleDateString("es", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        temps: [],
        humidity: [],
        weather: item.weather[0].main,
        timestamp: item.dt,
      };
    }

    dailyData[dateKey].temps.push(item.main.temp);
    dailyData[dateKey].humidity.push(item.main.humidity);
  });

  const forecast = Object.values(dailyData)
    .slice(0, 5)
    .map((day) => ({
      date: capitalizeFirstLetter(day.date),
      maxTemp: Math.round(Math.max(...day.temps)),
      minTemp: Math.round(Math.min(...day.temps)),
      avgHumidity: Math.round(
        day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length,
      ),
      weather: day.weather,
      icon: getWeatherIcon(day.weather),
    }));

  return forecast;
}

function updateForecastUI(forecastData) {
  const forecastContainer = document.getElementById("forecastContainer");
  if (!forecastContainer) return;

  const forecast = processForecastData(forecastData);

  if (forecast.length === 0) {
    console.log("No hay datos de pronóstico disponibles");
    return;
  }

  forecastContainer.innerHTML = forecast
    .map(
      (day) => `
    <div class="flex items-center justify-between py-2">
      <div class="flex items-center gap-3 flex-1">
        <i
          class="fa-solid ${day.icon} text-2xl"
          style="color: rgba(255, 255, 255, 0.9)"
        ></i>
        <span class="font-medium">${day.date}</span>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-sm opacity-80">${day.avgHumidity}%</span>
        <i
          class="fa-solid fa-droplet text-sm"
          style="color: rgba(255, 255, 255, 0.7)"
        ></i>
        <span class="font-semibold min-w-[60px] text-right"
          >${day.maxTemp}°/${day.minTemp}°</span
        >
      </div>
    </div>
  `,
    )
    .join("");

  console.log("Pronóstico de 5 días actualizado");
}

function updateWeatherUI(weatherData) {
  if (!weatherData) return;

  const locationElement = document.querySelector(".fa-location-dot + span");
  if (locationElement) {
    locationElement.textContent = `${weatherData.name}, ${weatherData.sys.country}`;
  }

  const descriptionElement = document.querySelector(".fa-cloud-sun + span");
  if (descriptionElement) {
    const description = weatherData.weather[0].description
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    descriptionElement.textContent = description;
  }

  const tempElement = document.querySelector("h1.font-bold.text-4xl");
  if (tempElement) {
    tempElement.innerHTML = `${Math.round(weatherData.main.temp)} <span class="font-medium">°C</span>`;
  }

  const windElement = document.getElementById("windS").querySelector("p");
  if (windElement) {
    windElement.textContent = `Viento ${Math.round(weatherData.wind.speed)} km/h`;
  }

  const humidityElement = document
    .querySelector(".fa-droplet")
    .closest("article")
    .querySelector("h2");
  if (humidityElement) {
    humidityElement.textContent = `${weatherData.main.humidity}%`;
  }

  const maxElement = document.getElementById("maxT");
  if (maxElement) {
    maxElement.textContent = `${Math.round(weatherData.main.temp_max)} °C`;
  }

  const minElement = document.getElementById("minT");
  if (minElement) {
    minElement.textContent = `${Math.round(weatherData.main.temp_min)} °C`;
  }

  const dewPointElement = document.getElementById("dewPoint");
  if (dewPointElement) {
    console.log("feels_like original:", weatherData.main.feels_like);
    console.log(
      "feels_like redondeado:",
      Math.round(weatherData.main.feels_like),
    );
    dewPointElement.textContent = `${Math.round(weatherData.main.feels_like)}°C`;
  }

  console.log("UI actualizada con datos del clima");
}

async function getWeatherByCoords(lat, lon) {
  const API_KEY = import.meta.env.VITE_API_KEY;
  const API_URL = import.meta.env.VITE_API_URL;

  try {
    const url = `${API_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Error HTTP: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log("Datos del clima obtenidos por coordenadas:", data);
    return data;
  } catch (error) {
    console.error("Error al obtener clima por coordenadas:", error);
    return null;
  }
}

async function getForecastByCoords(lat, lon) {
  const API_KEY = import.meta.env.VITE_API_KEY;
  const API_URL = import.meta.env.VITE_API_URL;

  try {
    const forecastUrl = API_URL.replace("/weather", "/forecast");
    const url = `${forecastUrl}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Error HTTP: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log("Datos del pronóstico obtenidos por coordenadas:", data);
    return data;
  } catch (error) {
    console.error("Error al obtener pronóstico por coordenadas:", error);
    return null;
  }
}

async function getLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error al obtener ubicación:", error);
          reject(error);
        },
      );
    } else {
      reject(new Error("Geolocalización no soportada"));
    }
  });
}

async function loadWeatherByLocation() {
  try {
    console.log("Obteniendo ubicación del usuario...");
    const location = await getLocation();

    if (location) {
      console.log("Ubicación obtenida:", location);
      const weatherData = await getWeatherByCoords(
        location.latitude,
        location.longitude,
      );
      const forecastData = await getForecastByCoords(
        location.latitude,
        location.longitude,
      );

      if (weatherData) {
        updateWeatherUI(weatherData);
      }

      if (forecastData) {
        updateForecastUI(forecastData);
      }
    }
  } catch (error) {
    console.log(
      "No se pudo obtener la ubicación automáticamente:",
      error.message,
    );

    const defaultCity = "Hermosillo";
    const weatherData = await getWeatherByCity(defaultCity);
    const forecastData = await getForecastByCity(defaultCity);

    if (weatherData) {
      updateWeatherUI(weatherData);
      console.log(`Datos cargados para ciudad por defecto: ${defaultCity}`);
    }

    if (forecastData) {
      updateForecastUI(forecastData);
    }
  }
}

loadWeatherByLocation();
