# Wendler 5/3/1 Workout Logger

> **Don't pay for 5/3/1 apps. Vibe-coded it instead!**

An offline-first Progressive Web App for planning and logging **Wendler 5/3/1** strength training workouts. Built for serious lifters who want full control, zero subscriptions, and a dark theme optimized for the gym.

## Features

### Core Workouts
- **Wendler 5/3/1 periodization** – 4-week cycles with 5/5/5+, 3/3/3+, 5/3/1+, and deload weeks
- **Leader/Anchor structure** – Configure multiple leader and anchor cycles
- **7th Week Protocol** – Test your max or deload after each cycle
- **Supplements** – Built-in Boring But Big (5x10) and First Set Last (5x5) options

### Calculations & Tracking
- **1RM calculator** – Epley formula with N-rep max estimates
- **Training Max (TM)** – Set your own percentage (75–95%)
- **Automatic weight calculation** – Respects your unit preference (kg/lbs) and rounding increments
- **AMRAP tracking** – Log your all-out final set and see estimated 1RM progress
- **Per-set logging** – Record actual reps for every work set
- **Progress charts** – Visualize AMRAP gains over cycles

### Accessories & Customization
- **Accessory logging** – Set target reps/weight, log per-set completion
- **Preset system** – Save favorite accessories (push, pull, legs, core, other)
- **Rest timer** – Countdown between sets
- **Custom notes** – Add context to any workout

### Data & Offline
- **Full offline support** – Service Worker caches everything. No connection? No problem.
- **Data export/import** – Backup your training data as JSON
- **Progressive Web App** – Install on iPhone, Android, or desktop for app-like experience
- **Local storage only** – All data stored in IndexedDB. No accounts, no servers, no tracking.

## Getting Started

### Install

```bash
git clone https://github.com/hanjin-kim/my531.git
cd my531
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and start editing.

### Build for Production

```bash
npm run build
npm run preview
```

Builds to `dist/` with automatic Service Worker registration. **~111 KB gzipped.**

### Run Tests

```bash
npm test        # Run once
npm run test:watch  # Watch mode
```

59 tests cover the calculation engine, cycle generation, and 7th week logic.

## Adding to Your Home Screen

**iOS (Safari):**
1. Open in Safari
2. Tap **Share** > **Add to Home Screen**
3. Name it, tap **Add**

**Android (Chrome):**
1. Open in Chrome
2. Tap **⋮** menu > **Install app**

**Desktop:**
1. Visit the live site
2. Browser shows an install prompt (or check the address bar)

## Tech Stack

| Layer | Tools |
|-------|-------|
| **UI** | React 19, TypeScript 5.7 |
| **Build** | Vite 6 |
| **Styling** | Tailwind CSS v4 (dark mode only) |
| **Storage** | Dexie.js v4 (IndexedDB) |
| **State** | Zustand v5 (ephemeral UI state) |
| **PWA** | vite-plugin-pwa |
| **Testing** | Vitest |

## Project Structure

```
src/
├── core/              # Calculation engine
│   ├── calculator.ts  # 1RM, TM, weight calculations
│   ├── cycle-generator.ts  # Periodization logic
│   ├── program-engine.ts   # Program orchestration
│   └── types.ts       # TypeScript definitions
├── pages/             # Route pages (Setup, Workout, History, etc.)
├── components/        # React components
├── db/                # Dexie schema, repositories, seeding
├── stores/            # Zustand stores (settings, navigation, UI)
├── hooks/             # Custom React hooks
└── App.tsx            # Router setup
```

## Configuration

First time? The **Setup** page walks you through:
1. Pick your 4 main lifts (or use defaults: Squat, Bench, Deadlift, OHP)
2. Enter your 1RM for each
3. Set your Training Max percentage (default: 85%)
4. Choose weight unit (kg or lbs) and rounding
5. Configure leader/anchor cycles and supplement type

Change settings anytime in **Settings** page. TM and lift data update retroactively.

## Local Development Tips

### Adding a Feature

1. Update types in `src/core/types.ts`
2. Add calculation logic in `src/core/`
3. Update the Dexie schema in `src/db/schema.ts` if needed
4. Build your UI components in `src/components/`
5. Test calculations in `src/core/__tests__/`

### Database

Data lives in IndexedDB under `wendler531`. Use browser DevTools to inspect:
- **Chrome/Edge:** DevTools > Application > IndexedDB > wendler531
- **Safari:** Develop > Show Storage Inspector > IndexedDB > wendler531

### Styling

Tailwind is configured for **dark mode only** (`dark` class on `<html>`). Update `tailwind.config.ts` to change theme or add custom colors.

## Known Limitations

- **Single program per device** – The app assumes one active program at a time. Switching programs requires archiving the current one.
- **Manual TM updates** – TM only increases when you complete a 7th Week Protocol test. Update manually in Settings if needed.
- **No cloud sync** – Data is 100% local. Use export/import to move data between devices.

## Contributing

Found a bug? Have an idea? Open an issue on [GitHub](https://github.com/hanjin-kim/my531).

## License

MIT

---

**Questions about Wendler 5/3/1?** Check out [the original article](https://jimwendler.com/blogs/articles/101-strength-by-jim-wendler) by Jim Wendler.
