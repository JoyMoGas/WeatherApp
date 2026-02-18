import { getWeatherByCity, getForecastByCity } from "./api.js";
import { loadWeatherAdvice, updateAdviceModal } from "./adviceLoader.js";

const inputElement = document.getElementById("citySearch");

inputElement.addEventListener("keypress", async (e) => {
  if (e.key === "Enter") {
    handleSearch();
  }
});

inputElement.addEventListener("input", function () {
  const value = this.value.toLowerCase();
  const history = loadCityHistory();

  if (value.trim() === "") {
    hideSuggestions();
    return;
  }

  const filtered = history.filter((city) => city.toLowerCase().includes(value));
  showSuggestions(filtered);
});

inputElement.addEventListener("focus", function () {
  const value = this.value.trim();
  const history = loadCityHistory();

  if (value === "") {
    showSuggestions(history);
  } else {
    const filtered = history.filter((city) =>
      city.toLowerCase().includes(value.toLowerCase()),
    );
    showSuggestions(filtered);
  }
});

document.addEventListener("click", function (e) {
  if (
    e.target !== inputElement &&
    e.target.closest("#searchSuggestions") === null
  ) {
    hideSuggestions();
  }
});

async function handleSearch(cityNameOverride) {
  const cityName = cityNameOverride || inputElement.value.trim();

  if (cityName) {
    hideSuggestions();

    inputElement.value = cityName;

    const weatherData = await getWeatherByCity(cityName, (status, data) => {
      if (status === "retry") {
        showNotification(
          `Conexión inestable. Reintentando... (${data.attempt}/${data.max})`,
          "warning",
        );
      } else if (status === "circuit_open") {
        showNotification(
          "Servicio temporalmente no disponible. Intente más tarde.",
          "error",
        );
      } else if (status === "success") {
      }
    });

    const forecastData = await getForecastByCity(cityName);

    if (weatherData) {
      updateWeatherUI(weatherData);
      saveCityToHistory(weatherData.name);
    } else {
    }

    if (forecastData) {
      updateForecastUI(forecastData);
    }
  }
}

function showNotification(message, type = "info") {
  const container = document.getElementById("notificationContainer");
  if (!container) return;

  const notification = document.createElement("div");
  let bgClass = "bg-blue-500/90";
  let iconClass = "fa-circle-info";

  if (type === "warning") {
    bgClass = "bg-yellow-500/90";
    iconClass = "fa-triangle-exclamation";
  } else if (type === "error") {
    bgClass = "bg-red-500/90";
    iconClass = "fa-circle-xmark";
  } else if (type === "success") {
    bgClass = "bg-green-500/90";
    iconClass = "fa-check-circle";
  }

  notification.className = `${bgClass} backdrop-blur-md text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 transform transition-all duration-300 translate-y-[-20px] opacity-0 pointer-events-auto`;
  notification.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <span class="font-medium text-sm">${message}</span>
  `;

  container.appendChild(notification);

  requestAnimationFrame(() => {
    notification.classList.remove("translate-y-[-20px]", "opacity-0");
  });

  setTimeout(() => {
    notification.classList.add("translate-y-[-20px]", "opacity-0");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 4000);
}

function loadCityHistory() {
  const history = localStorage.getItem("weatherCityHistory");
  return history ? JSON.parse(history) : [];
}

function saveCityToHistory(city) {
  let history = loadCityHistory();

  history = history.filter((c) => c.toLowerCase() !== city.toLowerCase());

  history.unshift(city);

  if (history.length > 10) {
    history = history.slice(0, 10);
  }

  localStorage.setItem("weatherCityHistory", JSON.stringify(history));
}

function showSuggestions(suggestions) {
  const suggestionsList = document.getElementById("searchSuggestions");
  if (!suggestionsList) return;

  if (suggestions.length === 0) {
    suggestionsList.classList.add("hidden");
    return;
  }

  suggestionsList.innerHTML = suggestions
    .map(
      (city) => `
    <li class="px-4 py-2 hover:bg-white/10 cursor-pointer text-white transition-colors border-b border-white/10 last:border-0 flex items-center gap-2">
      <i class="fa-solid fa-clock-rotate-left text-xs opacity-70"></i>
      <span>${city}</span>
    </li>
  `,
    )
    .join("");

  suggestionsList.classList.remove("hidden");

  Array.from(suggestionsList.children).forEach((li) => {
    li.addEventListener("click", function () {
      const city = this.querySelector("span").textContent;
      handleSearch(city);
    });
  });
}

function hideSuggestions() {
  const suggestionsList = document.getElementById("searchSuggestions");
  if (suggestionsList) {
    setTimeout(() => {
      suggestionsList.classList.add("hidden");
    }, 200);
  }
}

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
  const forecastContainerDesktop = document.getElementById("forecastContainer");
  const forecastContainerMobile = document.getElementById(
    "forecastContainerMobile",
  );

  const forecast = processForecastData(forecastData);

  if (forecast.length === 0) {
    return;
  }

  const forecastHTML = forecast
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

  if (forecastContainerDesktop) {
    forecastContainerDesktop.innerHTML = forecastHTML;
  }
  if (forecastContainerMobile) {
    forecastContainerMobile.innerHTML = forecastHTML;
  }
}

function updateWeatherUI(weatherData) {
  if (!weatherData) return;

  const locationElement = document.querySelector(".fa-location-dot + span");
  if (locationElement) {
    locationElement.textContent = `${weatherData.name}, ${weatherData.sys.country}`;
  }

  const locationAdviceElement = document.querySelector(".locationAd");
  if (locationAdviceElement) {
    locationAdviceElement.textContent = `${weatherData.name}, ${weatherData.sys.country}`;
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

  const tempAdviceElement = document.querySelector(".tempAdvice");

  if (tempAdviceElement) {
    const description = weatherData.weather[0].description
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    tempAdviceElement.textContent = `${description} - ${Math.round(weatherData.main.temp)}°C`;
  }

  const windElement = document.getElementById("windSpeed");
  if (windElement) {
    windElement.textContent = `Viento ${Math.round(weatherData.wind.speed)} km/h`;
  }

  const humidityElement = document.getElementById("humidityValue");
  if (humidityElement) {
    humidityElement.textContent = `${weatherData.main.humidity}%`;
  }

  const sunriseElement = document.getElementById("sunriseTime");
  const sunsetElement = document.getElementById("sunsetTime");

  if (sunriseElement && weatherData.sys.sunrise) {
    const sunriseDate = new Date(weatherData.sys.sunrise * 1000);
    sunriseElement.textContent = sunriseDate.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (sunsetElement && weatherData.sys.sunset) {
    const sunsetDate = new Date(weatherData.sys.sunset * 1000);
    sunsetElement.textContent = sunsetDate.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
    dewPointElement.textContent = `${Math.round(weatherData.main.feels_like)}°C`;
  }

  updateAdviceModal(weatherData);
}

async function getWeatherByCoords(lat, lon) {
  const API_KEY = import.meta.env.VITE_API_KEY;
  const API_URL = import.meta.env.VITE_API_URL;

  try {
    const url = `${API_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`;
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
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
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
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
    const location = await getLocation();

    if (location) {
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
    const defaultCity = "Hermosillo";
    const weatherData = await getWeatherByCity(defaultCity);
    const forecastData = await getForecastByCity(defaultCity);

    if (weatherData) {
      updateWeatherUI(weatherData);
    }

    if (forecastData) {
      updateForecastUI(forecastData);
    }
  }
}

loadWeatherAdvice();

loadWeatherByLocation();
