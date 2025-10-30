# ekydum-ui

Angular client for ekydum-server (YouTube proxy).

## Requirements

- Node.js 18+
- npm or yarn
- ekydum-server running

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm start
```

3. Open browser at `http://localhost:4200`

4. Configure server connection in Settings page

## Features

- Channel subscriptions
- Channel video browsing
- Video playback with Plyr
- HLS streaming support
- User settings (quality, page size)
- Admin account management
- Toast notifications
- Responsive sidebar menu

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── subscriptions/  - Subscriptions list with search
│   │   ├── channel/        - Channel videos
│   │   ├── watch/          - Video player
│   │   ├── settings/       - User & server settings
│   │   └── manage/         - Admin account management
│   ├── services/
│   │   ├── api.service.ts     - API calls
│   │   ├── auth.service.ts    - Token management
│   │   └── toast.service.ts   - Notifications
│   ├── app.component.ts   - Main app with sidebar
│   └── app.routes.ts      - Routing configuration
├── styles.css             - Global styles
└── index.html
```

## Usage

### Settings Page
1. Enter ekydum-server URL (default: http://localhost:3000)
2. Enter your account token (get from admin)
3. Click "Save & Connect"
4. Configure quality and page size preferences

### Subscriptions
1. Search for channels using the search bar
2. Subscribe to channels from search results
3. Click on subscribed channels to view videos

### Watching Videos
1. Navigate to channel
2. Click on video thumbnail
3. Video plays with Plyr player
4. HLS streams supported automatically

### Admin Management
1. Enter admin token
2. Click "Save & Login"
3. Create, edit, or delete accounts
4. Copy account tokens for users

## Build

Production build:
```bash
npm run build
```

Output in `dist/ekydum-ui/`

## Technologies

- Angular 19
- Bootstrap 5
- FontAwesome 6
- Plyr 3.7
- hls.js 1.5
- RxJS 7
