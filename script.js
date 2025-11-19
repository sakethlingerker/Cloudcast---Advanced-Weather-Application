const apiKey = "2f5513f6ad9d9f27897a23a6a32fc28f";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&";
const forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?units=metric&";

const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search-btn");
const locationBtn = document.querySelector(".location-btn");
const weatherIcon = document.querySelector(".weather-icon");
const weatherDescription = document.querySelector(".weather-description");

// Dark gradient backgrounds for different weather conditions
const weatherBackgrounds = {
    Clear: "linear-gradient(135deg, #0c2461, #1e3799, #4a69bd)",
    Clouds: "linear-gradient(135deg, #2c3e50, #34495e, #7f8c8d)",
    Rain: "linear-gradient(135deg, #1a2980, #26d0ce)",
    Drizzle: "linear-gradient(135deg, #1a2980, #26d0ce)",
    Thunderstorm: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
    Snow: "linear-gradient(135deg, #1e3c72, #2a5298)",
    Mist: "linear-gradient(135deg, #485563, #29323c)",
    Fog: "linear-gradient(135deg, #2c3e50, #4ca1af)",
    Haze: "linear-gradient(135deg, #3a6073, #16222a)",
    Smoke: "linear-gradient(135deg, #2c3e50, #4ca1af)",
    Dust: "linear-gradient(135deg, #614385, #516395)",
    Sand: "linear-gradient(135deg, #614385, #516395)",
    Ash: "linear-gradient(135deg, #2c3e50, #4ca1af)",
    Squall: "linear-gradient(135deg, #0f0c29, #302b63)",
    Tornado: "linear-gradient(135deg, #870000, #190a05)",
    Default: "linear-gradient(135deg, #0c2461, #1e3799)"
}
// Weather icons mapping - using your local images
const weatherIcons = {
    Clear: "images/clear.png",
    Clouds: "images/clouds.png",
    Rain: "images/rain.png",
    Drizzle: "images/drizzle.png",
    Thunderstorm: "images/rain.png", // Using rain image for thunderstorm
    Snow: "images/snow.png",
    Mist: "images/mist.png",
    Fog: "images/mist.png",
    Haze: "images/mist.png"
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Check if user has a saved city
    const savedCity = localStorage.getItem('lastSearchedCity');
    if (savedCity) {
        searchBox.value = savedCity;
        checkWeather(savedCity);
    } else {
        // Try to get location on app start
        getLocation();
    }
});

async function checkWeather(city) {
    try {
        showLoadingState();
        const response = await fetch(apiUrl + `q=${city}&appid=${apiKey}`);

        if (response.status == 404) {
            showError();
        } else {
            const data = await response.json();
            updateWeatherUI(data);
            getForecast(data.coord.lat, data.coord.lon);
            
            // Save city to localStorage
            localStorage.setItem('lastSearchedCity', city);
        }
    } catch (error) {
        console.error("Error fetching weather data:", error);
        showError();
    }
}

async function checkWeatherByCoords(lat, lon) {
    try {
        showLoadingState();
        const response = await fetch(apiUrl + `lat=${lat}&lon=${lon}&appid=${apiKey}`);
        const data = await response.json();
        updateWeatherUI(data);
        getForecast(lat, lon);
        
        // Save city to localStorage
        localStorage.setItem('lastSearchedCity', data.name);
    } catch (error) {
        console.error("Error fetching weather data:", error);
        showError();
    }
}

function updateWeatherUI(data) {
    document.querySelector(".city").textContent = data.name;
    document.querySelector(".temp").textContent = Math.round(data.main.temp) + "°C";
    document.querySelector(".humidity").textContent = data.main.humidity + "%";
    document.querySelector(".wind").textContent = data.wind.speed + " km/h";
    document.querySelector(".feels-like").textContent = Math.round(data.main.feels_like) + "°C";
    document.querySelector(".pressure").textContent = data.main.pressure + " hPa";
    
    const weatherCondition = data.weather[0].main;
    weatherDescription.textContent = data.weather[0].description;
    
    updateWeatherIcon(weatherCondition);
    updateBackground(weatherCondition);

    document.querySelector(".weather").style.display = "block";
    document.querySelector(".error").style.display = "none";
}

function updateWeatherIcon(condition) {
    weatherIcon.src = weatherIcons[condition] || weatherIcons.Default;
    weatherIcon.alt = condition + " weather icon";
}

function updateBackground(condition) {
    document.body.style.background = weatherBackgrounds[condition] || weatherBackgrounds.Default;
}

async function getForecast(lat, lon) {
    try {
        const response = await fetch(forecastUrl + `lat=${lat}&lon=${lon}&appid=${apiKey}`);
        const data = await response.json();
        
        const forecastContainer = document.querySelector(".forecast-container");
        forecastContainer.innerHTML = ""; // Clear previous forecast

        // Filter for one forecast per day (at 12:00 PM)
        const dailyForecast = data.list.filter(item => item.dt_txt.includes("12:00:00"));
        
        // If we don't have 5 days of forecast, take the first 5 available
        const forecastToShow = dailyForecast.length >= 5 ? dailyForecast.slice(0, 5) : data.list.slice(0, 5);

        forecastToShow.forEach(day => {
            const date = new Date(day.dt * 1000);
            const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
            const condition = day.weather[0].main;
            const temp = Math.round(day.main.temp);
            const desc = day.weather[0].description;

            const forecastItem = document.createElement("div");
            forecastItem.classList.add("forecast-item");
            forecastItem.innerHTML = `
                <p class="forecast-day">${dayName}</p>
                <img src="${weatherIcons[condition] || weatherIcons.Default}" alt="${condition}" class="forecast-icon">
                <p class="forecast-temp">${temp}°C</p>
                <p class="forecast-desc">${desc}</p>
            `;
            forecastContainer.appendChild(forecastItem);
        });
    } catch (error) {
        console.error("Error fetching forecast:", error);
    }
}

function showLoadingState() {
    document.querySelector(".weather").style.display = "none";
    document.querySelector(".error").style.display = "none";
}

function showError() {
    document.querySelector(".error").style.display = "block";
    document.querySelector(".weather").style.display = "none";
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                checkWeatherByCoords(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                // If location access is denied, show default city
                checkWeather("New York");
            }
        );
    } else {
        // Geolocation not supported
        checkWeather("New York");
    }
}

// Event Listeners
searchBtn.addEventListener("click", () => {
    if (searchBox.value.trim() !== "") {
        checkWeather(searchBox.value);
    }
});

searchBox.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && searchBox.value.trim() !== "") {
        checkWeather(searchBox.value);
    }
});

locationBtn.addEventListener("click", () => {
    getLocation();
});

// Add some interactivity to the search box
searchBox.addEventListener('focus', function() {
    this.parentElement.classList.add('focused');
});

searchBox.addEventListener('blur', function() {
    this.parentElement.classList.remove('focused');
});
