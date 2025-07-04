# GeoReminder

GeoReminder is a cross-platform mobile app (React Native + Expo) for location-based reminders. Create, edit, and delete reminders that trigger notifications when you enter a defined area. Works offline and syncs with a Node.js/Postgres backend when logged in.

## Features

- Create, edit, and delete geo-reminders with title, content, location, and radius
- Works fully offline (reminders stored locally)
- Syncs reminders with backend when logged in (bidirectional, conflict-resilient)
- Each reminder has a unique ID (multiple reminders with same title possible)
- Map view with all reminders and geofencing
- No alerts after creating a reminder; input fields are cleared
- Home screen triggers backend sync; all other screens use only local data
- Modern UI with Nativewind (Tailwind CSS for React Native)

## Tech Stack

- **Frontend:** React Native, Expo, Nativewind, AsyncStorage
- **Backend:** Node.js, Express, PostgreSQL (NeonDB), JWT Auth

## Getting Started

### Prerequisites
- Node.js (LTS)
- Expo CLI (`npm install -g expo-cli`)
- PostgreSQL database (NeonDB or local)

### Setup

1. **Clone the repository:**
   ```sh
   git clone https://github.com/yourusername/GeoReminder.git
   cd GeoReminder
   ```

2. **Install dependencies:**
   ```sh
   cd GeoReminder
   npm install
   cd ../GeoReminderBackend
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env` in `GeoReminderBackend` and set your database and JWT secrets.

4. **Run the backend:**
   ```sh
   cd GeoReminderBackend
   node server.js
   ```

5. **Run the app:**
   ```sh
   cd ../GeoReminder
   npx expo start
   ```

## Usage

- Register or log in to sync reminders with the backend.
- Create reminders with a title, content, location (via map or search), and radius.
- Reminders work offline and sync automatically when you return to the Home screen while logged in.
- View all reminders on the map; geofencing notifications are triggered when entering a reminder area.

## Data Flow

- All reminder operations use unique IDs (localId/serverId)
- Home screen triggers backend sync; other screens only update local data
- See `DATAFLOW_SUMMARY.md` for detailed data flow and sync logic

## License

MIT
