# Okapi Real Estate — Mobile App

React Native mobile app built with **Expo SDK 55**, **Expo Router v4** (file-based navigation), and **NativeWind v4** (Tailwind CSS for React Native). It is a faithful port of the existing Next.js web app, sharing the same backend API and design language.

---

## Tech Stack

| Concern        | Technology                              |
| -------------- | --------------------------------------- |
| Framework      | Expo SDK 55 + Expo Router v4            |
| Styling        | NativeWind v4 (Tailwind CSS)            |
| Navigation     | Expo Router (file-based)                |
| State          | Zustand v5                              |
| Data fetching  | TanStack Query v5 + Axios               |
| Forms          | React Hook Form v7 + Zod v4             |
| Icons          | Lucide React Native                     |
| Fonts          | DM Sans (@expo-google-fonts/dm-sans)    |
| Auth storage   | Zustand persist + AsyncStorage          |
| Images         | expo-image                              |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Xcode) or Android emulator

### Install dependencies

```bash
npm install
```

### Environment variables

Create a `.env` file at the project root:

```env
EXPO_PUBLIC_API_URL=http://your-backend-url:8080
```

If omitted, the app defaults to `http://localhost:8080`.

### Run the app

```bash
npx expo start         # opens the Expo dev menu
npx expo start --clear # same but clears Metro cache (use when things act up)
```

---

## Project Structure

```
app/                    # Expo Router file-based routes
  _layout.tsx           # Root layout (Stack navigator + providers)
  (tabs)/               # Bottom-tab route group
    _layout.tsx         # Tab bar configuration
    index.tsx           # Home screen
    acheter.tsx         # Buy screen
    louer.tsx           # Rent screen
    agents.tsx          # Agents & agencies screen
    compte/             # Account nested stack
      _layout.tsx
      index.tsx
      profil.tsx
      favoris.tsx
      alertes.tsx
      demandes.tsx
      avis.tsx
  (auth)/               # Auth route group
    _layout.tsx
    connexion.tsx
    inscription.tsx
    mot-de-passe-oublie.tsx
  property/[id].tsx     # Property detail
  agents/[id].tsx       # Agent profile
  agences/[id].tsx      # Agency detail
  blog/                 # Blog routes
  conseils/             # Conseils routes
  +not-found.tsx

src/
  components/
    ui/                 # Generic UI: Button, Input, Badge, Avatar, StarRating,
    |                   #   Loader, EmptyState, Card
    property/           # PropertyCard, SearchBar, PropertyFilters
    agent/              # AgentCard, AgencyCard
    QueryProvider.tsx   # TanStack Query client provider
  constants/
    colors.ts           # Design tokens (matches web globals.css)
    api.ts              # API_URL constant
  hooks/
    useDebounce.ts
    useAuthGuard.ts
    useProperties.ts
    useAgents.ts
    useAgencies.ts
  services/             # Axios API calls: agents, agencies, properties, auth
  store/
    useAuthStore.ts     # Zustand auth store (persisted to AsyncStorage)
  types/                # TypeScript types: Agent, Agency, Property, User
  lib/
    blog.ts             # Static blog data
```

---

## Key Configuration Files

| File                  | Purpose                                                       |
| --------------------- | ------------------------------------------------------------- |
| `app.json`            | Expo config — name, slug, scheme, plugins                    |
| `babel.config.js`     | Babel: `babel-preset-expo` + `nativewind/babel`               |
| `metro.config.js`     | Metro: `withNativeWind` wrapper pointing to `global.css`      |
| `tailwind.config.js`  | Tailwind: custom design tokens, NativeWind preset, font names |
| `global.css`          | Tailwind directives (base / components / utilities)           |
| `nativewind-env.d.ts` | TypeScript reference for NativeWind `className` prop types    |
| `tsconfig.json`       | Strict TypeScript, `@/*` path alias → `./src/*`               |

---

## Design Tokens

All values mirror the web app's `globals.css`:

| Token            | Value     |
| ---------------- | --------- |
| `primary`        | `#1E63B5` |
| `navy`           | `#0B1D3A` |
| `secondary`      | `#D4AF37` |
| `background`     | `#FFFFFF` |
| `background-alt` | `#F2F4F7` |
| `muted-fg`       | `#64748B` |
| `border`         | `#E2E8F0` |
| `accent`         | `#EAF2FB` |
| `destructive`    | `#DC2626` |

Font family classes: `font-sans`, `font-sans-medium`, `font-sans-semibold`, `font-sans-bold`.

---

## NativeWind Notes

- Use **complete conditional class strings** instead of template literals with empty fallbacks to avoid trailing-space bugs:

  ```tsx
  // Good
  className={isActive ? "flex-1 bg-white" : "flex-1"}

  // Bad — produces a trailing space when inactive
  className={`flex-1 ${isActive ? "bg-white" : ""}`}
  ```

- Dynamic classes computed at runtime must still appear somewhere in source so Tailwind's scanner picks them up.

---

## Navigation

- **Root layout** (`app/_layout.tsx`): wraps everything in `GestureHandlerRootView` → `QueryProvider` → `Stack`.
- **Tab layout** (`app/(tabs)/_layout.tsx`): five tabs — Accueil, Acheter, Louer, Agents, Compte.
- **Auth guard** (`src/hooks/useAuthGuard.ts`): redirects to `/connexion` if the user is not authenticated.
- **Imperative navigation**: use `router.push()` / `router.replace()` from `expo-router` (not `useNavigation`).

---

## Common Commands

```bash
npx expo start --clear       # start with clean Metro cache
npx expo install <package>   # install an Expo-compatible package version
npx expo install --fix       # align all Expo package versions
```
