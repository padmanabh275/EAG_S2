# City Time & Weather Companion Chrome Extension

This Chrome extension allows users to compare time zones and weather information for two different cities using the Google Gemini API and OpenWeatherMap API.

## Features

- Compare time zones between two cities
- View current weather information for both cities
- Clean and intuitive user interface
- Real-time data updates

## Setup Instructions

1. Clone or download this repository
2. Get your API keys:
   - Get a Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Get a free OpenWeatherMap API key from [OpenWeatherMap](https://openweathermap.org/api)
3. Open `popup.js` and replace:
   - `YOUR_GEMINI_API_KEY` with your actual Gemini API key
   - `YOUR_WEATHER_API_KEY` with your actual OpenWeatherMap API key
4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon in your Chrome toolbar
2. Enter the names of two cities you want to compare
3. Click "Get Information" to see the time and weather details for both cities

## Dependencies

- Google Gemini API
- OpenWeatherMap API

## Note

Make sure to keep your API keys secure and never share them publicly.

## License

This project is licensed under the MIT License. 