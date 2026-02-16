const API_KEY = import.meta.env.VITE_API_KEY;
const API_URL = import.meta.env.VITE_API_URL;

async function retryWithBackoff(fn, maxRetries = 3, delay = 1000) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const waitTime = delay * Math.pow(2, attempt);
        console.log(
          `Intento ${attempt + 1} falló. Reintentando en ${waitTime}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}

class CircuitBreaker {
  constructor(threshold, timeout) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failures = 0;
    this.state = "CLOSED";
  }

  async execute(request) {
    if (this.isStateOpen()) {
      throw new Error("Circuit is open, service is unavailable");
    }

    try {
      const response = await request();
      this.state = "CLOSED";
      this.failures = 0;
      return response;
    } catch (err) {
      this.failures++;
      if (this.failures >= this.threshold) {
        this.state = "OPEN";
        setTimeout(() => {
          this.state = "HALF-OPEN";
        }, this.timeout);
      }
      throw err;
    }
  }

  isStateOpen() {
    return this.state === "OPEN";
  }
}


const weatherCircuitBreaker = new CircuitBreaker(3, 5000);

export async function getWeatherByCity(cityName) {
  try {
    if (!cityName || cityName.trim() === "") {
      console.error("Error: Debes proporcionar el nombre de una ciudad");
      return null;
    }

    if (!API_KEY || !API_URL) {
      console.error("Error: Faltan las variables de entorno API_KEY o API_URL");
      return null;
    }

    const url = `${API_URL}?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric&lang=es`;

    console.log(`Solicitando datos del clima para: ${cityName}`);

    const response = await weatherCircuitBreaker.execute(async () => {
      return await retryWithBackoff(async () => {
        const res = await fetch(url);

        if (!res.ok && res.status >= 400 && res.status < 500) {
          if (res.status === 404) {
            console.error(`Ciudad "${cityName}" no encontrada`);
          } else if (res.status === 401) {
            console.error("Error de autenticación: API_KEY inválida");
          } else {
            console.error(`Error HTTP: ${res.status} - ${res.statusText}`);
          }
          return null;
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        return res;
      });
    });

    if (!response) return null;

    const data = await response.json();

    console.log("Datos del clima obtenidos exitosamente:", data);

    return data;
  } catch (error) {
    console.error("Error al obtener datos del clima:", error.message);
    return null;
  }
}

export async function getForecastByCity(cityName) {
  try {
    if (!cityName || cityName.trim() === "") {
      console.error("Error: Debes proporcionar el nombre de una ciudad");
      return null;
    }

    if (!API_KEY || !API_URL) {
      console.error("Error: Faltan las variables de entorno API_KEY o API_URL");
      return null;
    }

    const forecastUrl = API_URL.replace("/weather", "/forecast");
    const url = `${forecastUrl}?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric&lang=es`;

    console.log(`Solicitando pronóstico del clima para: ${cityName}`);

    // Wrap fetch in retry logic
    const response = await retryWithBackoff(async () => {
      const res = await fetch(url);

      // Don't retry on client errors (4xx), only on server errors (5xx) or network issues
      if (!res.ok && res.status >= 400 && res.status < 500) {
        if (res.status === 404) {
          console.error(`Ciudad "${cityName}" no encontrada`);
        } else if (res.status === 401) {
          console.error("Error de autenticación: API_KEY inválida");
        } else {
          console.error(`Error HTTP: ${res.status} - ${res.statusText}`);
        }
        return null;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return res;
    });

    if (!response) return null;

    const data = await response.json();

    console.log("Datos del pronóstico obtenidos exitosamente:", data);

    return data;
  } catch (error) {
    console.error("Error al obtener pronóstico del clima:", error.message);
    return null;
  }
}

// Ejemplo de uso:
// getWeatherByCity('Madrid').then(data => {
//   if (data) {
//     console.log('Temperatura:', data.main.temp);
//     console.log('Descripción:', data.weather[0].description);
//   }
// });

// getForecastByCity('Madrid').then(data => {
//   if (data) {
//     console.log('Pronóstico de 5 días:', data.list);
//     // data.list contiene 40 puntos de datos (cada 3 horas durante 5 días)
//   }
// });
