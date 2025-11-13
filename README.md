# Ekydum Web UI

A web client for Ekydum Server.

## Quick Start

1. Clone or download this repository

2. Configure nginx using `nginx-reverse-proxy.example.conf` to serve files from `dist/` directory

3. Open browser and navigate to your domain

## Initial Setup

### Server Admin Setup

1. Open **Manage** page
2. Enter Server URL and Admin Token
3. Create first account and additional accounts as needed

### User Setup

1. Open **Settings** page
2. Enter Server URL and Account Token
3. Start using the application

## Development

Requirements:
- Node.js v.22+
- npm or yarn
- Ekydum Server running

Start development server:
```bash
npm install
npm start
```

Open browser at `http://localhost:4200`

Build for production:
```bash
npm run build
```

## Technologies

- Angular 19
- Bootstrap
- FontAwesome
- hls.js
- RxJS
