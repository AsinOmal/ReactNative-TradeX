<div align="center">

# TradeX · P&L Tracker

**A modern, feature-rich mobile application for tracking trading performance**

[![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=flat-square&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-000020?style=flat-square&logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.6-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)

</div>

---

## Overview

TradeX is a comprehensive trading journal and P&L tracking application built with React Native and Expo. It helps traders monitor their performance through detailed analytics, monthly tracking, and individual trade logging with real-time cloud synchronization.

### Key Features

- 📊 **Monthly P&L Tracking** — Track capital, deposits, withdrawals, and net profit/loss
- 📈 **Individual Trade Logging** — Log trades with entry/exit prices, quantities, and tags
- 🎯 **Goal Setting** — Set yearly profit targets with visual progress tracking
- 📱 **Cross-Platform** — Runs on iOS and Android with native performance
- 🔐 **Firebase Authentication** — Secure Google Sign-In with real-time data sync
- 🌙 **Dark/Light Mode** — Adaptive theming based on system preferences
- 📄 **PDF Reports** — Generate and share professional trading reports
- 🔒 **Privacy Mode** — Hide sensitive financial data with one tap

---

## Tech Stack

### Core

| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.81.5 | Cross-platform mobile framework |
| Expo | 54.0 | Development platform & tooling |
| TypeScript | 5.9 | Type-safe JavaScript |
| Expo Router | 6.0 | File-based navigation |

### Backend & Data

| Technology | Purpose |
|------------|---------|
| Firebase Auth | User authentication (Google Sign-In) |
| Cloud Firestore | Real-time NoSQL database |
| React Context API | Global state management |

### UI/UX

| Library | Purpose |
|---------|---------|
| React Native Reanimated | Fluid animations |
| React Native Gesture Handler | Touch gestures & swipe actions |
| Expo Linear Gradient | Gradient backgrounds |
| Expo Haptics | Tactile feedback |

### Testing & Quality

| Tool | Purpose |
|------|---------|
| Jest | Unit testing framework |
| ESLint | Code linting |
| TypeScript | Static type checking |

---

## Architecture

```
src/
├── components/          # Reusable UI components
│   ├── MonthCard.tsx   # Monthly performance card
│   ├── SwipeableRow.tsx # Swipeable list item
│   └── ...
├── context/            # React Context providers
│   ├── AuthContext.tsx # Authentication state
│   ├── TradingContext.tsx # Trading data & operations
│   └── ThemeContext.tsx # Dark/Light mode
├── services/           # Business logic & API
│   ├── firestoreService.ts # Firebase operations
│   ├── calculationService.ts # P&L calculations
│   ├── tradeCalculationService.ts # Trade analytics
│   └── pdfService.ts   # Report generation
├── types/              # TypeScript interfaces
├── utils/              # Helper functions
│   ├── formatters.ts   # Currency/date formatting
│   └── scaling.ts      # Responsive scaling
└── config/             # Configuration files
    ├── firebaseConfig.ts
    └── fonts.ts

app/                    # Expo Router pages
├── (tabs)/             # Tab navigation screens
│   ├── index.tsx       # Home (Dashboard)
│   ├── trades.tsx      # Trade list
│   ├── calendar.tsx    # Calendar view
│   ├── analytics.tsx   # Performance analytics
│   └── history.tsx     # Monthly history
├── add-month.tsx       # Add month form
├── add-trade.tsx       # Add trade form
├── onboarding.tsx      # First-time user flow
└── login.tsx           # Authentication
```

---

## Data Models

### MonthRecord
```typescript
interface MonthRecord {
  id: string;
  month: string;              // 'YYYY-MM' format
  year: number;
  startingCapital: number;
  endingCapital: number;
  deposits: number;
  withdrawals: number;
  grossChange: number;        // Computed
  netProfitLoss: number;      // Computed
  returnPercentage: number;   // Computed
  pnlSource: 'manual' | 'trades';
  status: 'active' | 'closed';
}
```

### Trade
```typescript
interface Trade {
  id: string;
  symbol: string;
  tradeType: 'long' | 'short';
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;                // Computed
  returnPercentage: number;   // Computed
  tags: string[];
  monthKey: string;           // Links to month
}
```

---

## Features Deep Dive

### Real-Time Data Synchronization
All data is synchronized in real-time using Firestore's `onSnapshot` listeners:
- Instant updates across devices
- Offline-first with automatic sync when online
- Optimistic UI updates for responsive UX

### Analytics Engine
The calculation services compute:
- **Monthly Stats**: Net P&L, ROI%, profit factor, win rate
- **Trade Stats**: Win streaks, best/worst trades, per-symbol performance
- **Goal Progress**: YTD performance vs. annual targets

### PDF Report Generation
Uses `expo-print` with custom HTML templates:
- Professional branded layout
- Monthly summary with key metrics
- Trade table with performance breakdown
- Automatic date formatting

### Responsive Design
Custom scaling utilities ensure consistent UI across screen sizes:
```typescript
const scale = (size: number) => PixelRatio.roundToNearestPixel(size * SCALE_FACTOR);
const fontScale = (size: number) => scale(size) * FONT_SCALE;
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (macOS) or Android Emulator

### Installation

```bash
# Clone the repository
git clone https://github.com/AsinOmal/ReactNative-PnL-Tracker.git
cd ReactNative-PnL-Tracker

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Google Sign-In)
3. Enable **Cloud Firestore**
4. Add your `GoogleService-Info.plist` (iOS) and `google-services.json` (Android)
5. Update `src/config/firebaseConfig.ts` with your config

---

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

Current test coverage includes:
- Calculation service (20 tests)
- Trade calculation service (24 tests)

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo development server |
| `npm run ios` | Run on iOS Simulator |
| `npm run android` | Run on Android Emulator |
| `npm test` | Run test suite |
| `npm run lint` | Run ESLint |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is private and not licensed for public use.

---

<div align="center">

</div>
