// Cargar los consejos del archivo JSON
let weatherAdviceData = null;

export async function loadWeatherAdvice() {
  if (weatherAdviceData) return weatherAdviceData;

  try {
    const response = await fetch("/data/weatherAdvice.json");
    if (!response.ok) {
      throw new Error(`Error al cargar consejos: ${response.status}`);
    }
    weatherAdviceData = await response.json();
    console.log("Consejos meteorológicos cargados:", weatherAdviceData);
    return weatherAdviceData;
  } catch (error) {
    console.error("Error al cargar weatherAdvice.json:", error);
    return null;
  }
}

// Determinar la categoría de clima basada en la descripción
function getWeatherCategory(weatherDescription, temperature) {
  const desc = weatherDescription.toLowerCase();

  // Verificar temperatura extrema primero
  if (temperature >= 35) {
    return "hot";
  }
  if (temperature <= 0) {
    return "cold";
  }

  // Verificar condiciones extremas
  if (
    desc.includes("tornado") ||
    desc.includes("huracán") ||
    desc.includes("hurricane") ||
    desc.includes("squall")
  ) {
    return "extreme";
  }

  // Verificar tormenta
  if (
    desc.includes("tormenta") ||
    desc.includes("thunderstorm") ||
    desc.includes("trueno")
  ) {
    return "thunderstorm";
  }

  // Verificar nieve
  if (
    desc.includes("nieve") ||
    desc.includes("snow") ||
    desc.includes("nevada")
  ) {
    return "snow";
  }

  // Verificar lluvia
  if (
    desc.includes("lluvia") ||
    desc.includes("rain") ||
    desc.includes("llovizna") ||
    desc.includes("drizzle")
  ) {
    return "rain";
  }

  // Verificar niebla/neblina
  if (
    desc.includes("niebla") ||
    desc.includes("fog") ||
    desc.includes("mist") ||
    desc.includes("neblina") ||
    desc.includes("bruma") ||
    desc.includes("calima") ||
    desc.includes("haze") ||
    desc.includes("smoke")
  ) {
    return "mist";
  }

  // Verificar nubes
  if (
    desc.includes("nube") ||
    desc.includes("cloud") ||
    desc.includes("nuboso")
  ) {
    return "clouds";
  }

  // Por defecto, cielo despejado
  return "clear";
}

// Obtener consejos basados en el clima actual
export function getAdviceForWeather(weatherData) {
  if (!weatherAdviceData || !weatherData) return null;

  const description = weatherData.weather[0].description;
  const temperature = weatherData.main.temp;

  const category = getWeatherCategory(description, temperature);
  console.log(`Categoría de clima detectada: ${category}`);

  const categoryData = weatherAdviceData.weatherAdvice[category];
  if (!categoryData) {
    console.warn(`No se encontraron consejos para la categoría: ${category}`);
    return null;
  }

  return {
    category,
    advice: categoryData.advice,
  };
}

// Actualizar el modal con los consejos
export function updateAdviceModal(weatherData) {
  if (!weatherData) return;

  const adviceData = getAdviceForWeather(weatherData);
  if (!adviceData) {
    console.warn("No se pudieron obtener consejos para el clima actual");
    return;
  }

  const modalContent = document.querySelector("#myModal .space-y-4");
  if (!modalContent) return;

  // Mantener el primer div (información de ubicación y temperatura)
  const locationInfo = modalContent.querySelector(".bg-white\\/10");

  // Limpiar el contenido existente excepto la info de ubicación
  modalContent.innerHTML = "";
  if (locationInfo) {
    modalContent.appendChild(locationInfo);
  }

  // Crear las secciones de consejos
  adviceData.advice.forEach((adviceItem) => {
    const adviceSection = document.createElement("div");
    adviceSection.className = "space-y-2";

    // Determinar el color del icono basado en la prioridad
    let iconColor = "text-blue-300";
    if (adviceItem.priority === "high") {
      iconColor = "text-red-400";
    } else if (adviceItem.priority === "medium") {
      iconColor = "text-yellow-300";
    }

    adviceSection.innerHTML = `
      <h3 class="font-semibold text-base flex items-center gap-2">
        <i class="fa-solid ${adviceItem.icon} ${iconColor}"></i>
        ${adviceItem.title}
      </h3>
      <ul class="space-y-2 ml-6">
        <li class="flex items-start gap-2 text-sm">
          <i class="fa-solid fa-circle-info text-blue-300 mt-1"></i>
          <span>${adviceItem.description}</span>
        </li>
      </ul>
    `;

    modalContent.appendChild(adviceSection);
  });

  console.log("Modal de consejos actualizado con éxito");
}
