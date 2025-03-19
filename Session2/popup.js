// Get your API key from https://makersuite.google.com/app/apikey
const GEMINI_API_KEY = 'AIzaSyD5-pnWcuac8gRUeOnMiXleStD5DKTEgkw';
const WEATHER_API_KEY = 'e992d80a3a6ab5db0fc85f649d449065'; // You can get a free API key from OpenWeatherMap
const TICKETMASTER_API_KEY = 'YOUR_TICKETMASTER_API_KEY'; // Replace with your Ticketmaster API key

document.addEventListener('DOMContentLoaded', () => {
  const getInfoButton = document.getElementById('getInfo');
  const city1Input = document.getElementById('city1');
  const city2Input = document.getElementById('city2');
  const date1Input = document.getElementById('date1');
  const date2Input = document.getElementById('date2');
  const errorDiv = document.getElementById('error');

  // Set default dates to today
  const today = new Date().toISOString().split('T')[0];
  date1Input.value = today;
  date2Input.value = today;

  getInfoButton.addEventListener('click', async () => {
    const city1 = city1Input.value.trim();
    const city2 = city2Input.value.trim();
    const date1 = date1Input.value;
    const date2 = date2Input.value;

    if (!city1 || !city2) {
      showError('Please enter both cities');
      return;
    }

    if (!date1 || !date2) {
      showError('Please select dates for both cities');
      return;
    }

    // Clear previous results
    clearResults('city1Results');
    clearResults('city2Results');

    // Get information for each city independently
    try {
      await getCityInfo(city1, 'city1Results', date1);
    } catch (error) {
      console.error('Error for city 1:', error);
      showCityError('city1Results', error.message);
    }

    try {
      await getCityInfo(city2, 'city2Results', date2);
    } catch (error) {
      console.error('Error for city 2:', error);
      showCityError('city2Results', error.message);
    }
  });
});

function clearResults(resultsDivId) {
  const resultsDiv = document.getElementById(resultsDivId);
  const timeDiv = resultsDiv.querySelector('.time');
  const weatherDiv = resultsDiv.querySelector('.weather');
  const eventsDiv = resultsDiv.querySelector('.events');
  
  timeDiv.innerHTML = `
    <span class="material-icons">schedule</span>
    <div class="info-container">
      <em>Loading...</em>
    </div>
  `;
  weatherDiv.innerHTML = `
    <span class="material-icons">thermostat</span>
    <div class="info-container">
      <em>Loading...</em>
    </div>
  `;
  eventsDiv.innerHTML = `
    <span class="material-icons">event</span>
    <div class="info-container">
      <em>Loading...</em>
    </div>
  `;
}

function showCityError(resultsDivId, message) {
  const resultsDiv = document.getElementById(resultsDivId);
  const timeDiv = resultsDiv.querySelector('.time');
  const weatherDiv = resultsDiv.querySelector('.weather');
  const eventsDiv = resultsDiv.querySelector('.events');
  
  timeDiv.innerHTML = `
    <span class="material-icons">error</span>
    <div class="info-container">
      <span class="error">Error: ${message}</span>
    </div>
  `;
  weatherDiv.innerHTML = `
    <span class="material-icons">error</span>
    <div class="info-container">
      <span class="error">Unable to fetch weather data</span>
    </div>
  `;
  eventsDiv.innerHTML = `
    <span class="material-icons">error</span>
    <div class="info-container">
      <span class="error">Unable to fetch events data</span>
    </div>
  `;
}

async function getCityInfo(city, resultsDivId, date) {
  const resultsDiv = document.getElementById(resultsDivId);
  const timeDiv = resultsDiv.querySelector('.time');
  const weatherDiv = resultsDiv.querySelector('.weather');
  const eventsDiv = resultsDiv.querySelector('.events');

  try {
    // Get timezone information using Gemini API
    const timezoneInfo = await getTimezoneInfo(city);
    timeDiv.innerHTML = `
      <span class="material-icons">schedule</span>
      <div class="info-container">
        <strong>Selected Date:</strong> ${formatDate(date)}<br>
        <strong>Timezone:</strong> ${timezoneInfo.timezone}
      </div>
    `;

    // Get weather information for the selected date
    const weatherInfo = await getWeatherInfo(city, date);
    const weatherIcon = getWeatherIcon(weatherInfo.description);
    weatherDiv.innerHTML = `
      <span class="material-icons">${weatherIcon}</span>
      <div class="info-container">
        <strong>Temperature:</strong> ${weatherInfo.temp}&deg;C<br>
        <strong>Weather:</strong> ${weatherInfo.description}<br>
        <strong>Humidity:</strong> ${weatherInfo.humidity}%
      </div>
    `;

    // Get events information for the selected date
    const eventsInfo = await getEventsInfo(city, date);
    eventsDiv.innerHTML = eventsInfo;

    // Update the city name in the header
    resultsDiv.querySelector('h2').innerHTML = `<span class="material-icons">location_city</span>${city}`;
  } catch (error) {
    console.error(`Error for ${city}:`, error);
    throw new Error(`Failed to get information for ${city}: ${error.message}`);
  }
}

async function getTimezoneInfo(city) {
  try {
    // Get timezone information from weather API first
    const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${WEATHER_API_KEY}`);
    
    if (!weatherResponse.ok) {
      const errorData = await weatherResponse.json();
      throw new Error(errorData.message || 'City not found. Please check the spelling and try again.');
    }

    const weatherData = await weatherResponse.json();
    const timezoneOffsetSeconds = weatherData.timezone;
    
    // Get current UTC timestamp
    const utcTimestamp = Date.now();
    
    // Calculate city's local timestamp by adding the offset from UTC
    const cityTimestamp = utcTimestamp + (timezoneOffsetSeconds * 1000);
    
    // Create a date object with the city's timestamp
    const cityDate = new Date(cityTimestamp);
    
    // Format the time
    const localTime = cityDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'  // This ensures we don't apply local timezone offset again
    });

    // Get timezone name based on offset
    const tzName = getTimezoneNameFromOffset(timezoneOffsetSeconds, city);

    console.log(`Time calculation for ${city}:`, {
      city,
      timezoneOffset: `${timezoneOffsetSeconds / 3600} hours`,
      utcTime: new Date(utcTimestamp).toUTCString(),
      cityTime: cityDate.toUTCString(),
      formattedTime: localTime
    });

    return {
      localTime: localTime,
      timezone: tzName
    };
  } catch (error) {
    console.error(`Timezone fetch error for ${city}:`, error);
    throw new Error(`Could not get timezone information: ${error.message}`);
  }
}

// Helper function to get timezone name from offset
function getTimezoneNameFromOffset(offsetSeconds, city) {
  // Common timezone mappings
  const timezoneMap = {
    'Singapore': 'Asia/Singapore',
    'Mumbai': 'Asia/Kolkata',
    'Delhi': 'Asia/Kolkata',
    'Ahmedabad': 'Asia/Kolkata',
    'Kolkata': 'Asia/Kolkata',
    'Tokyo': 'Asia/Tokyo',
    'New York': 'America/New_York',
    'London': 'Europe/London',
    'Paris': 'Europe/Paris',
    'Dubai': 'Asia/Dubai',
    'Hong Kong': 'Asia/Hong_Kong',
    'Sydney': 'Australia/Sydney',
    'Los Angeles': 'America/Los_Angeles',
    'Chicago': 'America/Chicago',
    'Toronto': 'America/Toronto',
    'Shanghai': 'Asia/Shanghai',
    'Beijing': 'Asia/Shanghai'
  };

  // Try to get the timezone from the map first
  const cityLower = city.toLowerCase();
  for (const [key, value] of Object.entries(timezoneMap)) {
    if (cityLower.includes(key.toLowerCase())) {
      return value;
    }
  }

  // If not found in map, construct a generic timezone name based on offset
  const hours = Math.abs(Math.floor(offsetSeconds / 3600));
  const minutes = Math.abs(Math.floor((offsetSeconds % 3600) / 60));
  const sign = offsetSeconds >= 0 ? '+' : '-';
  
  return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Helper function to format date
function formatDate(dateString) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

async function getWeatherInfo(city, date) {
  try {
    // For future dates (up to 5 days), use the forecast API
    const today = new Date().toISOString().split('T')[0];
    const selectedDate = new Date(date);
    const diffTime = Math.abs(selectedDate - new Date(today));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 5) {
      throw new Error('Weather forecast is only available for the next 5 days');
    }

    if (date === today) {
      // Use current weather API for today
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${WEATHER_API_KEY}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch weather information');
      }
      const data = await response.json();
      return {
        temp: Math.round(data.main.temp),
        description: data.weather[0].description,
        humidity: data.main.humidity
      };
    } else {
      // Use forecast API for future dates
      const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${WEATHER_API_KEY}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch weather forecast');
      }
      const data = await response.json();
      
      // Find the forecast for the selected date (using noon of that day)
      const targetDate = date.split('T')[0];
      const forecast = data.list.find(item => {
        const itemDate = new Date(item.dt * 1000).toISOString().split('T')[0];
        return itemDate === targetDate;
      });

      if (!forecast) {
        throw new Error('No forecast available for the selected date');
      }

      return {
        temp: Math.round(forecast.main.temp),
        description: forecast.weather[0].description,
        humidity: forecast.main.humidity
      };
    }
  } catch (error) {
    throw new Error(`Weather API error for ${city}: ${error.message}`);
  }
}

// Helper function to get weather icon based on description
function getWeatherIcon(description) {
  const desc = description.toLowerCase();
  if (desc.includes('clear')) return 'wb_sunny';
  if (desc.includes('cloud')) return 'cloud';
  if (desc.includes('rain')) return 'water_drop';
  if (desc.includes('snow')) return 'ac_unit';
  if (desc.includes('thunder')) return 'flash_on';
  if (desc.includes('fog') || desc.includes('mist')) return 'cloud';
  if (desc.includes('wind')) return 'air';
  return 'thermostat';
}

async function getEventsInfo(city, date) {
  try {
    const selectedDate = new Date(date);
    const formattedDate = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Use the Google Gemini API to search for events
    const requestBody = {
      contents: [{
        role: "user",
        parts: [{
          text: `You are an events information assistant. For the city of ${city} on ${formattedDate}, create a list of 5 events happening on that specific date. Include major concerts, sports events, theater shows, or cultural events. Format the response EXACTLY as a JSON object like this example:
          {
            "events": [
              {
                "summary": "Taylor Swift Concert",
                "date": "${formattedDate}",
                "time": "7:30 PM",
                "location": "City Stadium"
              }
            ]
          }
          If no events are found, return {"events": []}`
        }]
      }],
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error Response:', errorData);
      throw new Error(errorData.error?.message || 'Failed to fetch events');
    }

    const data = await response.json();
    console.log('Gemini API Response:', data); // Debug log

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid API response format');
    }
    
    // Parse the response from Gemini
    try {
      let eventsText = data.candidates[0].content.parts[0].text;
      console.log('Raw events text:', eventsText); // Debug log
      
      // Clean up the response text to ensure valid JSON
      eventsText = eventsText.replace(/```json\n?|\n?```/g, '').trim();
      
      // Try to find JSON object in the response
      const jsonMatch = eventsText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No valid JSON found in response');
        throw new Error('Invalid response format');
      }
      
      const jsonText = jsonMatch[0];
      console.log('Extracted JSON:', jsonText); // Debug log
      
      const eventsData = JSON.parse(jsonText);

      if (!eventsData.events || eventsData.events.length === 0) {
        return `
          <div class="no-events">
            <div class="event-message">No upcoming events found in ${city}</div>
            <div class="event-tip">Tip: Try searching for specific venues or areas in ${city}</div>
          </div>`;
      }

      const events = eventsData.events.map(event => {
        const eventTitle = event.summary || 'Untitled Event';
        const eventDate = event.date || 'Date TBA';
        const eventTime = event.time || '';
        const eventLocation = event.location || 'Venue TBA';

        return `
          <div class="event-item">
            <div class="event-title">${eventTitle}</div>
            <div class="event-date">${eventDate}${eventTime ? ` at ${eventTime}` : ''}</div>
            <div class="event-venue">
              <span class="material-icons">place</span>
              ${eventLocation}
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="events-list">
          <div class="events-header">
            <span class="material-icons">event</span>
            Upcoming Events in ${city}
          </div>
          ${events}
        </div>`;
    } catch (parseError) {
      console.error('Error parsing events data:', parseError);
      console.error('Response text:', data.candidates[0]?.content?.parts[0]?.text);
      throw new Error('Unable to process events data');
    }
  } catch (error) {
    console.error('Events API Error:', error);
    return `
      <div class="no-events">
        <div class="event-message">Unable to fetch events</div>
        <div class="event-tip">Please try again later</div>
      </div>`;
  }
}

function showError(message) {
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = message;
  setTimeout(() => {
    errorDiv.textContent = '';
  }, 5000); // Increased to 5 seconds for better readability
} 