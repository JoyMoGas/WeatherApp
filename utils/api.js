const API_KEY = import.meta.env.VITE_API_KEY;
const API_URL = import.meta.env.VITE_API_URL;

async function retryWithBackoff(
  fn,
  maxRetries = 3,
  delay = 1000,
  onRetry = null,
) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const waitTime = delay * Math.pow(2, attempt);
        if (onRetry) {
          onRetry(attempt + 1, maxRetries, waitTime);
        }
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

export async function getWeatherByCity(cityName, onStatusUpdate = null) {
  try {
    if (!cityName || cityName.trim() === "") {
      return null;
    }

    if (!API_KEY || !API_URL) {
      return null;
    }

    const url = `${API_URL}?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric&lang=es`;

    const response = await weatherCircuitBreaker.execute(async () => {
      return await retryWithBackoff(
        async () => {
          const res = await fetch(url);

          if (!res.ok && res.status >= 400 && res.status < 500) {
            if (res.status === 404) {
            }
            return null;
          }

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }

          return res;
        },
        3,
        1000,
        (attempt, max, wait) => {
          if (onStatusUpdate) {
            onStatusUpdate(`retry`, { attempt, max, wait });
          }
        },
      );
    });

    if (!response) return null;

    const data = await response.json();
    if (onStatusUpdate) onStatusUpdate("success");
    return data;
  } catch (error) {
    if (error.message.includes("Circuit is open")) {
      if (onStatusUpdate) onStatusUpdate("circuit_open");
    } else {
      if (onStatusUpdate) onStatusUpdate("error", error.message);
    }
    return null;
  }
}

export async function getForecastByCity(cityName, onStatusUpdate = null) {
  try {
    if (!cityName || cityName.trim() === "") {
      return null;
    }

    if (!API_KEY || !API_URL) {
      return null;
    }

    const forecastUrl = API_URL.replace("/weather", "/forecast");
    const url = `${forecastUrl}?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric&lang=es`;

    const response = await retryWithBackoff(
      async () => {
        const res = await fetch(url);

        if (!res.ok && res.status >= 400 && res.status < 500) {
          return null;
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        return res;
      },
      3,
      1000,
      (attempt, max, wait) => {
      },
    );

    if (!response) return null;

    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
}
