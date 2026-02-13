const API_KEY = import.meta.env.VITE_API_KEY;
const API_URL = import.meta.env.VITE_API_URL;

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

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        console.error(`Ciudad "${cityName}" no encontrada`);
      } else if (response.status === 401) {
        console.error("Error de autenticación: API_KEY inválida");
      } else {
        console.error(
          `Error HTTP: ${response.status} - ${response.statusText}`,
        );
      }
      return null;
    }

    const data = await response.json();

    console.log("Datos del clima obtenidos exitosamente:", data);

    return data;
  } catch (error) {
    console.error("Error al obtener datos del clima:", error.message);
    return null;
  }
}

// Ejemplo de uso (comentado):
// getWeatherByCity('Madrid').then(data => {
//   if (data) {
//     console.log('Temperatura:', data.main.temp);
//     console.log('Descripción:', data.weather[0].description);
//   }
// });
