# Okapi Real Estate — React Native Mobile App

## Complete Build Instructions for Claude

This document is a complete, sequential, task-by-task guide for building the Okapi Real Estate mobile app with React Native (Expo). The mobile app is a faithful port of the existing Next.js web app, sharing the same backend API, the same business logic, and the same design language.

---

## Technology Stack

| Concern       | Web (existing)                 | Mobile (this guide)                |
| ------------- | ------------------------------ | ---------------------------------- |
| Framework     | Next.js 16                     | Expo SDK 52 + Expo Router v4       |
| Styling       | Tailwind CSS v4                | NativeWind v4                      |
| Navigation    | Next.js App Router             | Expo Router (file-based)           |
| State         | Zustand v5                     | Zustand v5 (same)                  |
| Data fetching | TanStack Query v5 + Axios      | TanStack Query v5 + Axios (same)   |
| Forms         | React Hook Form v7 + Zod v4    | React Hook Form v7 + Zod v4 (same) |
| Icons         | Lucide React                   | Lucide React Native                |
| Auth storage  | Zustand persist (localStorage) | Zustand persist (AsyncStorage)     |
| Image         | next/image                     | expo-image                         |
| Fonts         | DM Sans (next/font)            | @expo-google-fonts/dm-sans         |

---

## Design Tokens (must match web app)

Copy these exact values — they come from `globals.css` in the web app:

```
Primary blue:    #1E63B5
Primary hover:   #174E90
Navy:            #0B1D3A
Secondary gold:  #D4AF37
Background:      #FFFFFF
Background alt:  #F2F4F7
Foreground:      #1A1F2B
Muted fg:        #64748B
Border:          #E2E8F0
Accent:          #EAF2FB
Destructive:     #DC2626
Card:            #FFFFFF
```

---

## Phase 1 — Project Bootstrap

### Task 1.1 — Create the Expo project

```bash
npx create-expo-app@latest okapi-real-estate-mobile --template blank-typescript
cd okapi-real-estate-mobile
```

### Task 1.2 — Install all dependencies

Run these commands in order:

```bash
# Expo Router (file-based navigation)
npx expo install expo-router expo-linking expo-constants expo-status-bar

# NativeWind (Tailwind for React Native)
npm install nativewind@^4.1.23
npm install --save-dev tailwindcss@3.4.15

# React Native Safe Area and Screens (required by Expo Router)
npx expo install react-native-safe-area-context react-native-screens

# State + data fetching (same as web)
npm install zustand @tanstack/react-query axios

# Forms + validation (same as web)
npm install react-hook-form @hookform/resolvers zod

# Async storage (for Zustand persist on mobile)
npx expo install @react-native-async-storage/async-storage

# Icons
npm install lucide-react-native

# Fonts
npx expo install @expo-google-fonts/dm-sans expo-font

# Image
npx expo install expo-image

# Haptics (native feedback)
npx expo install expo-haptics

# Web browser (for WhatsApp links)
npx expo install expo-web-browser

# Clipboard (for share functionality)
npx expo install expo-clipboard

# Camera (for avatar upload)
npx expo install expo-image-picker

# SVG support
npx expo install react-native-svg
```

### Task 1.3 — Configure `package.json` main entry

Add to `package.json`:

```json
{
  "main": "expo-router/entry"
}
```

### Task 1.4 — Configure `app.json`

Replace `app.json` with:

```json
{
  "expo": {
    "name": "Okapi Real Estate",
    "slug": "okapi-real-estate",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "scheme": "okapi",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0B1D3A"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.okapi.realestate"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0B1D3A"
      },
      "package": "com.okapi.realestate"
    },
    "web": {
      "bundler": "metro"
    },
    "plugins": [
      "expo-router",
      "expo-font",
      [
        "expo-image-picker",
        {
          "photosPermission": "Okapi needs access to your photos to update your profile picture."
        }
      ]
    ]
  }
}
```

### Task 1.5 — Configure NativeWind

Create `tailwind.config.js` at the project root:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#1E63B5",
        "primary-hover": "#174E90",
        navy: "#0B1D3A",
        secondary: "#D4AF37",
        background: "#FFFFFF",
        "background-alt": "#F2F4F7",
        foreground: "#1A1F2B",
        "muted-fg": "#64748B",
        border: "#E2E8F0",
        accent: "#EAF2FB",
        destructive: "#DC2626",
        card: "#FFFFFF",
        "text-dark": "#1A1F2B",
        "text-light": "#6B7A99",
      },
      fontFamily: {
        sans: ["DMSans_400Regular", "sans-serif"],
        "sans-medium": ["DMSans_500Medium", "sans-serif"],
        "sans-semibold": ["DMSans_600SemiBold", "sans-serif"],
        "sans-bold": ["DMSans_700Bold", "sans-serif"],
      },
    },
  },
  plugins: [],
};
```

Create `babel.config.js` at the project root:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

Create `metro.config.js` at the project root:

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

Create `global.css` at the project root:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Create `nativewind-env.d.ts` at the project root:

```ts
/// <reference types="nativewind/types" />
```

### Task 1.6 — Create the folder structure

Create these directories:

```
app/
  (auth)/
  (tabs)/
  property/
  agents/
  agences/
  blog/
  conseils/
src/
  components/
    ui/
    layout/
    property/
    agent/
  hooks/
  lib/
  services/
  store/
  types/
  constants/
```

---

## Phase 2 — Shared Types and Constants

### Task 2.1 — Copy and adapt types

Create `src/types/property.ts` — copy exactly from the web app's `src/features/properties/types/property.ts`. No changes needed.

Create `src/types/agent.ts` — copy exactly from the web app's `src/features/agents/types/agent.ts`. No changes needed.

Create `src/types/agency.ts` — copy exactly from the web app's `src/features/agency/types/agency.ts`. No changes needed.

Create `src/types/user.ts` — copy exactly from the web app's `src/features/properties/types/user.ts`. No changes needed.

### Task 2.2 — Create design constants

Create `src/constants/colors.ts`:

```ts
export const Colors = {
  primary: "#1E63B5",
  primaryHover: "#174E90",
  navy: "#0B1D3A",
  secondary: "#D4AF37",
  background: "#FFFFFF",
  backgroundAlt: "#F2F4F7",
  foreground: "#1A1F2B",
  mutedFg: "#64748B",
  border: "#E2E8F0",
  accent: "#EAF2FB",
  destructive: "#DC2626",
  card: "#FFFFFF",
  textDark: "#1A1F2B",
  textLight: "#6B7A99",
  white: "#FFFFFF",
  black: "#000000",
};
```

Create `src/constants/layout.ts`:

```ts
export const Layout = {
  padding: 16,
  paddingLg: 24,
  borderRadius: 12,
  borderRadiusLg: 16,
  borderRadiusFull: 9999,
};
```

---

## Phase 3 — Services Layer

### Task 3.1 — Environment configuration

Create `src/constants/api.ts`:

```ts
// Change this to your actual backend URL
// For local development with a physical device, use your machine's local IP
// e.g., "http://192.168.1.100:3000"
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
```

Create `.env` at project root:

```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### Task 3.2 — Auth service

Create `src/services/auth.ts` — copy the entire file from the web app's `src/services/auth.ts`. Make ONE change: replace every `/api/proxy/` URL prefix with the direct backend URL:

```ts
import axios from "axios";
import { API_URL } from "../constants/api";
import type { User } from "../types/user";

const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export async function loginUser(email: string, password: string) {
  const res = await axios.post<{ access_token: string }>(
    `${API_URL}/auth/login`,
    { email, password },
  );
  return res.data;
}

export async function registerUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}) {
  const res = await axios.post<{ access_token: string }>(
    `${API_URL}/auth/register`,
    data,
  );
  return res.data;
}

export async function forgotPassword(email: string) {
  const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
  return res.data;
}

export async function getMe(token: string): Promise<User> {
  const res = await axios.get<User>(`${API_URL}/users/me`, {
    headers: authHeader(token),
  });
  return res.data;
}

export async function updateMe(token: string, data: Partial<Omit<User, "id">>) {
  const res = await axios.patch<User>(`${API_URL}/users/me`, data, {
    headers: authHeader(token),
  });
  return res.data;
}

export async function changePassword(
  token: string,
  data: { currentPassword: string; newPassword: string },
) {
  const res = await axios.patch(`${API_URL}/users/me/password`, data, {
    headers: authHeader(token),
  });
  return res.data;
}

export async function uploadAvatar(
  token: string,
  uri: string,
  fileName: string,
  mimeType: string,
) {
  const formData = new FormData();
  formData.append("file", { uri, name: fileName, type: mimeType } as any);
  const res = await axios.patch<User>(`${API_URL}/users/me/avatar`, formData, {
    headers: { ...authHeader(token), "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function removeAvatar(token: string) {
  const res = await axios.delete<User>(`${API_URL}/users/me/avatar`, {
    headers: authHeader(token),
  });
  return res.data;
}

export async function deleteAccount(token: string) {
  await axios.delete(`${API_URL}/users/me`, { headers: authHeader(token) });
}

// --- Favorites ---
export type Favourite = {
  id: string;
  propertyId: string;
  property: {
    id: string;
    title: string;
    price: number;
    imageUrl?: string;
    location: string;
    type: string;
    gallery: string[];
  };
  createdAt: string;
};

export async function getFavourites(token: string): Promise<Favourite[]> {
  const res = await axios.get<Favourite[]>(`${API_URL}/favorites`, {
    headers: authHeader(token),
  });
  return res.data;
}

export async function addFavourite(token: string, propertyId: string) {
  const res = await axios.post(
    `${API_URL}/favorites`,
    { propertyId },
    { headers: authHeader(token) },
  );
  return res.data;
}

export async function removeFavourite(token: string, propertyId: string) {
  await axios.delete(`${API_URL}/favorites/${propertyId}`, {
    headers: authHeader(token),
  });
}

// --- Alerts ---
export type Alert = {
  id: string;
  name: string;
  listingType?: string;
  category?: string;
  city?: string;
  suburb?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  active?: boolean;
  createdAt: string;
};

export type CreateAlertPayload = Omit<Alert, "id" | "createdAt">;
export type UpdateAlertPayload = Partial<CreateAlertPayload>;

export async function getAlerts(token: string): Promise<Alert[]> {
  const res = await axios.get<Alert[]>(`${API_URL}/alerts`, {
    headers: authHeader(token),
  });
  return res.data;
}

export async function createAlert(
  token: string,
  data: CreateAlertPayload,
): Promise<Alert> {
  const res = await axios.post<Alert>(`${API_URL}/alerts`, data, {
    headers: authHeader(token),
  });
  return res.data;
}

export async function updateAlert(
  token: string,
  id: string,
  data: UpdateAlertPayload,
): Promise<Alert> {
  const res = await axios.patch<Alert>(`${API_URL}/alerts/${id}`, data, {
    headers: authHeader(token),
  });
  return res.data;
}

export async function deleteAlert(token: string, id: string) {
  await axios.delete(`${API_URL}/alerts/${id}`, { headers: authHeader(token) });
}

// --- Enquiries ---
export type Enquiry = {
  id: string;
  propertyId: string;
  property?: { id: string; title: string };
  message: string;
  status: "pending" | "replied" | "closed";
  createdAt: string;
};

export async function getEnquiries(token: string): Promise<Enquiry[]> {
  const res = await axios.get<Enquiry[]>(`${API_URL}/enquiries`, {
    headers: authHeader(token),
  });
  return res.data;
}

export async function createEnquiry(
  token: string,
  data: { propertyId: string; message: string },
) {
  const res = await axios.post(`${API_URL}/enquiries`, data, {
    headers: authHeader(token),
  });
  return res.data;
}

export async function deleteEnquiry(token: string, id: string) {
  await axios.delete(`${API_URL}/enquiries/${id}`, {
    headers: authHeader(token),
  });
}

// --- Reviews ---
export type Review = {
  id: string;
  propertyId?: string;
  agentId?: string;
  property?: { id: string; title: string };
  agent?: { id: string; firstName: string; lastName: string };
  rating: number;
  comment?: string;
  createdAt: string;
};

export async function getMyReviews(token: string): Promise<Review[]> {
  const res = await axios.get<Review[]>(`${API_URL}/reviews/mine`, {
    headers: authHeader(token),
  });
  return res.data;
}

export async function createReview(
  token: string,
  data: {
    propertyId?: string;
    agentId?: string;
    rating: number;
    comment?: string;
  },
) {
  const res = await axios.post(`${API_URL}/reviews`, data, {
    headers: authHeader(token),
  });
  return res.data;
}

export async function deleteReview(token: string, id: string) {
  await axios.delete(`${API_URL}/reviews/${id}`, {
    headers: authHeader(token),
  });
}
```

### Task 3.3 — Properties service

Create `src/services/properties.ts`:

```ts
import axios from "axios";
import { API_URL } from "../constants/api";
import type { Property, PropertyDetail } from "../types/property";

export type PropertyParams = {
  listingType?: string;
  category?: string;
  city?: string;
  suburb?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  agentId?: string;
  agencyId?: string;
};

export async function fetchProperties(
  params: PropertyParams = {},
): Promise<{ data: Property[]; meta: any }> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) query.set(k, String(v));
  });
  const res = await axios.get(`${API_URL}/properties?${query.toString()}`);
  const json = res.data;
  return {
    data: Array.isArray(json) ? json : (json.data ?? []),
    meta: json.meta ?? {},
  };
}

export async function fetchPropertyById(id: string): Promise<PropertyDetail> {
  const res = await axios.get(`${API_URL}/properties/${id}`);
  return res.data;
}
```

### Task 3.4 — Agents service

Create `src/services/agents.ts`:

```ts
import axios from "axios";
import { API_URL } from "../constants/api";
import type { Agent } from "../types/agent";

export type AgentParams = {
  page?: number;
  limit?: number;
  name?: string;
  language?: string;
  nationality?: string;
};

export async function fetchAgents(
  params: AgentParams = {},
): Promise<{ data: Agent[]; meta: any }> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) query.set(k, String(v));
  });
  const res = await axios.get(`${API_URL}/agents?${query.toString()}`);
  const json = res.data;
  // Normalize agency field (backend returns object, frontend expects string)
  const data = (Array.isArray(json) ? json : (json.data ?? [])).map(
    (a: any) => ({
      ...a,
      agency:
        typeof a.agency === "object"
          ? (a.agency?.name ?? "")
          : (a.agency ?? ""),
    }),
  );
  return { data, meta: json.meta ?? {} };
}

export async function fetchAgentById(id: string): Promise<Agent> {
  const res = await axios.get(`${API_URL}/agents/${id}`);
  const a = res.data;
  return {
    ...a,
    agency:
      typeof a.agency === "object" ? (a.agency?.name ?? "") : (a.agency ?? ""),
  };
}
```

### Task 3.5 — Agencies service

Create `src/services/agencies.ts`:

```ts
import axios from "axios";
import { API_URL } from "../constants/api";
import type { Agency } from "../types/agency";

export type AgencyParams = {
  page?: number;
  limit?: number;
  name?: string;
  language?: string;
};

export async function fetchAgencies(
  params: AgencyParams = {},
): Promise<{ data: Agency[]; meta: any }> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) query.set(k, String(v));
  });
  const res = await axios.get(`${API_URL}/agencies?${query.toString()}`);
  const json = res.data;
  return {
    data: Array.isArray(json) ? json : (json.data ?? []),
    meta: json.meta ?? {},
  };
}

export async function fetchAgencyById(id: string): Promise<Agency> {
  const res = await axios.get(`${API_URL}/agencies/${id}`);
  return res.data;
}
```

---

## Phase 4 — State Management

### Task 4.1 — Auth store

Create `src/store/useAuthStore.ts` — adapt from web app, replacing `localStorage` persistence with AsyncStorage:

```ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "../types/user";

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    { name: "okapi-auth", storage: createJSONStorage(() => AsyncStorage) },
  ),
);
```

### Task 4.2 — Query Provider

Create `src/components/QueryProvider.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

---

## Phase 5 — Shared UI Components

Build these components in `src/components/ui/`. Each component must use NativeWind `className` prop (from `nativewind`). Use `View`, `Text`, `TouchableOpacity`, `TextInput` from `react-native`.

### Task 5.1 — Button component (`src/components/ui/Button.tsx`)

Props: `variant` ("default" | "outline" | "ghost" | "gold" | "navy" | "destructive"), `size` ("sm" | "md" | "lg"), `onPress`, `disabled`, `children`, `className`.

Style rules:

- default: `bg-primary` background, white text
- gold: `bg-secondary` background, `text-[#1A1F2B]`
- navy: `bg-navy` background, white text
- outline: transparent background, `border border-border`, foreground text
- ghost: transparent, foreground text
- destructive: `bg-destructive` background, white text
- Rounded-full (`rounded-full`)
- Heights: sm=36, md=44, lg=52
- Font: DMSans SemiBold

### Task 5.2 — Input component (`src/components/ui/Input.tsx`)

Props: standard `TextInput` props + `error?: string`, `label?: string`.

Style: height 44, border `border-border`, `rounded-xl`, `px-4`, `text-sm`, foreground text. When focused: `border-primary`. Show `error` text below in `text-destructive text-xs`. Show `label` above in `text-text-dark text-sm font-medium mb-1.5`.

### Task 5.3 — Card component (`src/components/ui/Card.tsx`)

`View` with `bg-white rounded-2xl shadow-sm border border-border`. Accepts `className` and `children`.

### Task 5.4 — Badge component (`src/components/ui/Badge.tsx`)

Pill-shaped `View` with `Text`. Props: `label`, `variant` ("primary" | "secondary" | "muted" | "gold"). Rounded-full, small padding.

### Task 5.5 — Avatar component (`src/components/ui/Avatar.tsx`)

Shows either an `Image` (from `expo-image`) or initials in a colored circle. Props: `name`, `photo?`, `size` (number, default 40). If `photo` is provided render `<Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: size/2 }} />`. Otherwise render a `View` with gradient-like background (`bg-primary`) and initials `Text` in white.

### Task 5.6 — StarRating component (`src/components/ui/StarRating.tsx`)

Renders 5 stars using `lucide-react-native` Star icon. Filled stars in secondary/gold, empty in border color. Props: `rating` (number), `size` (number, default 14).

### Task 5.7 — Loader component (`src/components/ui/Loader.tsx`)

`ActivityIndicator` from react-native centered in a `View`. Color: `Colors.primary`. Size: "large".

### Task 5.8 — EmptyState component (`src/components/ui/EmptyState.tsx`)

Centered `View` with icon (Lucide), `title`, and `subtitle` text, optional `action` button. Use for empty lists.

---

## Phase 6 — Navigation Setup

### Task 6.1 — Root layout (`app/_layout.tsx`)

```tsx
import { Stack } from "expo-router";
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import QueryProvider from "../src/components/QueryProvider";
import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <QueryProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen
          name="property/[id]"
          options={{
            headerShown: true,
            title: "Détail du bien",
            headerBackTitle: "Retour",
          }}
        />
        <Stack.Screen
          name="agents/[id]"
          options={{
            headerShown: true,
            title: "Profil agent",
            headerBackTitle: "Retour",
          }}
        />
        <Stack.Screen
          name="agences/[id]"
          options={{
            headerShown: true,
            title: "Agence",
            headerBackTitle: "Retour",
          }}
        />
        <Stack.Screen
          name="blog/[slug]"
          options={{
            headerShown: true,
            title: "Article",
            headerBackTitle: "Blog",
          }}
        />
        <Stack.Screen
          name="conseils/[slug]"
          options={{
            headerShown: true,
            title: "Conseils",
            headerBackTitle: "Conseils",
          }}
        />
      </Stack>
    </QueryProvider>
  );
}
```

### Task 6.2 — Tab layout (`app/(tabs)/_layout.tsx`)

Five bottom tabs:

1. **Accueil** — icon: `Home` — route: `index`
2. **Acheter** — icon: `Search` — route: `acheter`
3. **Louer** — icon: `Key` — route: `louer`
4. **Agents** — icon: `Users` — route: `agents`
5. **Compte** — icon: `User` — route: `compte`

```tsx
import { Tabs } from "expo-router";
import { Home, Search, Key, Users, User } from "lucide-react-native";
import { Colors } from "../../src/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.mutedFg,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
        },
        tabBarLabelStyle: { fontFamily: "DMSans_500Medium", fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="acheter"
        options={{
          title: "Acheter",
          tabBarIcon: ({ color }) => <Search size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="louer"
        options={{
          title: "Louer",
          tabBarIcon: ({ color }) => <Key size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="agents"
        options={{
          title: "Agents",
          tabBarIcon: ({ color }) => <Users size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="compte"
        options={{
          title: "Compte",
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

---

## Phase 7 — Property Components

### Task 7.1 — PropertyCard (`src/components/property/PropertyCard.tsx`)

Mirrors the web `PropertyCard`. Displays in a vertical list (not the two-column grid from web). Layout:

- `TouchableOpacity` wrapping the whole card, `onPress` navigates to `/property/${property.id}`
- Top: `Image` (expo-image) from `property.gallery[0]`, height 200, with overlay badges (Vérifié, Nouveau, Premium)
- Heart button top-right: calls `addFavourite`/`removeFavourite` from auth service, shows filled/outline heart
- Body: price (bold, large), title, suburb/city location, beds/baths/area chips, agent name + WhatsApp button

WhatsApp button opens: `https://wa.me/${agentPhone}?text=Bonjour, je suis intéressé par ${property.title}`

### Task 7.2 — PropertyFilters (`src/components/property/PropertyFilters.tsx`)

A horizontal scroll `ScrollView` of filter pill buttons:

- Type de bien (dropdown/modal)
- Prix (dropdown/modal)
- Chambres (dropdown/modal)
- Quartier (text input modal)

Each filter opens a `Modal` with options. Apply/clear buttons inside the modal.

Store filter state locally with `useState`. On change, propagate via `onFiltersChange` callback prop.

### Task 7.3 — SearchBar (`src/components/property/SearchBar.tsx`)

`TextInput` with a search icon on the left, clear button when text present. Placeholder: "Commune, quartier ou référence". `onSubmitEditing` triggers search.

---

## Phase 8 — Screens

### Task 8.1 — Home Screen (`app/(tabs)/index.tsx`)

Replicate the web home page in a `ScrollView`. Sections (top to bottom):

**Hero Section:**

- `LinearGradient` (install: `npx expo install expo-linear-gradient`) from navy to a slightly lighter navy
- Big title: "Trouvez votre bien idéal à Kinshasa"
- Subtitle text
- Two `Button` components: "Acheter" → navigate to `/(tabs)/acheter`, "Louer" → navigate to `/(tabs)/louer`

**Property Type Chips:**

- Horizontal `ScrollView` with chips: Appartements, Villas, Maisons, Studios, Commercial
- Each chip navigates to acheter with the type filter pre-set

**Featured Properties:**

- Horizontal scroll of 4 `PropertyCard` components
- "Voir plus" button navigates to `/(tabs)/acheter`
- Data from `fetchProperties({ limit: 4 })`

**Regions/Quartiers:**

- Grid of quartier chips (Gombe, Ngaliema, Limete, etc.)
- Clicking a quartier navigates to `/(tabs)/acheter?suburb=Gombe`

**Agent Promo Banner:**

- Navy background card with "Trouver un SuperAgent" button
- Navigate to `/(tabs)/agents?title=SUPERAGENT`

**Blog Preview:**

- 2 blog article cards from `src/lib/blog.ts` (the shared data from the web app — copy this file directly)
- "Voir le blog" button

### Task 8.2 — Acheter Screen (`app/(tabs)/acheter.tsx`)

Uses `useQuery` calling `fetchProperties({ listingType: "sale", ...filters })`.

Layout:

- `SafeAreaView` header with "Biens à acheter" title + filter icon button
- `SearchBar` component
- `PropertyFilters` component (horizontal scroll)
- Results count text
- `FlatList` of `PropertyCard` components
- `ActivityIndicator` while loading
- Empty state when no results
- Pagination: `onEndReached` loads more (increment page param)

### Task 8.3 — Louer Screen (`app/(tabs)/louer.tsx`)

Identical to Acheter but with `listingType: "rent"`. Title: "Biens à louer".

### Task 8.4 — Agents Screen (`app/(tabs)/agents.tsx`)

Uses `useQuery` calling `fetchAgents(params)`.

Layout:

- Segmented control at top: "Agents" | "Agences"
- Search bar for agent name
- Filter row: Langue, Nationalité
- `FlatList` of `AgentCard` components or `AgencyCard` components depending on tab
- Pull-to-refresh (`refreshControl` prop)

**AgentCard (`src/components/agent/AgentCard.tsx`):**

- Photo (Avatar component), name, title badge (SUPERAGENT | AGENT EXCLUSIF | AGENT), rating, specialization, agency monogram
- `TouchableOpacity` navigates to `/agents/${agent.id}`

**AgencyCard (`src/components/agent/AgencyCard.tsx`):**

- Colored monogram panel, agency name, tagline, agent count, areas served
- Navigates to `/agences/${agency.id}`

### Task 8.5 — Compte Screen (`app/(tabs)/compte.tsx`)

Conditional rendering:

- **Not authenticated:** Show login prompt with "Se connecter" and "S'inscrire" buttons navigating to `/(auth)/connexion` and `/(auth)/inscription`
- **Authenticated:** Show profile menu list

Profile menu items (use `FlatList` of touchable rows):

1. Mon Profil → `/compte/profil`
2. Mes Favoris → `/compte/favoris`
3. Mes Demandes → `/compte/demandes`
4. Mes Alertes → `/compte/alertes`
5. Mes Avis & Notes → `/compte/avis`
6. Se déconnecter → calls `logout()` from auth store

At the top show the user's avatar, name, and email.

### Task 8.6 — Auth screens

**`app/(auth)/_layout.tsx`:** Stack layout, header hidden.

**`app/(auth)/connexion.tsx` — Login Screen:**

- Logo image at top
- Email `Input`
- Password `Input` with show/hide toggle
- "Mot de passe oublié ?" link → `/(auth)/mot-de-passe-oublie`
- "Se connecter" `Button` — calls `loginUser` then `getMe` then `setAuth`, navigate to `/(tabs)/compte`
- Error banner for invalid credentials
- "Pas de compte ? S'inscrire" link

**`app/(auth)/inscription.tsx` — Register Screen:**

- Logo image
- Prénom, Nom `Input` (side by side using `View flex-row`)
- Email `Input`
- Téléphone `Input`
- Mot de passe `Input` + Confirmer le mot de passe `Input` with show/hide
- Checkbox for CGU acceptance
- "Créer mon compte" `Button` — calls `registerUser` then `getMe` then `setAuth`, navigate to `/(tabs)/compte`

**`app/(auth)/mot-de-passe-oublie.tsx` — Forgot Password:**

- Email `Input`
- "Envoyer le lien" `Button` — calls `forgotPassword`
- Success state showing confirmation message

### Task 8.7 — Property Detail Screen (`app/property/[id].tsx`)

Fetches `fetchPropertyById(id)` using `useQuery`.

Layout (all in a `ScrollView`):

1. **Image gallery:** `FlatList` horizontal with `pagingEnabled`, shows gallery images. Dot indicators below.
2. **Price + title**
3. **Stats row:** beds, baths, area, category chips
4. **Save button** (heart) + **Share button** (uses `expo-clipboard` to copy URL)
5. **Description** section
6. **Amenities** list
7. **Location** section (text-based, no map needed in MVP)
8. **Agent card:**
   - Agent avatar, name, title
   - "WhatsApp" button: `Linking.openURL("https://wa.me/...")`
   - "Appeler" button: `Linking.openURL("tel:...")`
   - "Soumettre une demande" button: opens a `Modal` with a `TextInput` for message + submit
9. **Agency info** (name, monogram)
10. **Property details table** (reference, type, surface, etc.)

The "Soumettre une demande" modal calls `createEnquiry(token, { propertyId: id, message })`. Requires authentication — if not logged in, navigate to auth.

### Task 8.8 — Agent Detail Screen (`app/agents/[id].tsx`)

Fetches `fetchAgentById(id)`.

Layout:

1. **Hero:** navy background, large avatar, agent name, title badge, rating stars, nationality + languages
2. **Contact buttons:** WhatsApp + Appeler (using `Linking`)
3. **Agency card:** monogram + agency name
4. **Stats:** forSaleCount, forRentCount, closedDeals, yearsExperience
5. **Bio** (expandable with "Lire plus")
6. **Zones d'expertise:** tab selector for areas, stats per area
7. **Properties:** segmented "À vendre" / "À louer", fetches `fetchProperties({ agentId: agent.id })`

### Task 8.9 — Agency Detail Screen (`app/agences/[id].tsx`)

Fetches `fetchAgencyById(id)`.

Layout:

1. **Hero:** colored banner (agency accentClass color), monogram, name, tagline
2. **Stats strip:** agents, listings, transactions, years
3. **About:** description text
4. **Specializations:** chips
5. **Areas served:** list
6. **Team:** list of agents from `fetchAgents` filtered by agency
7. **Contact card:** address, phone, email, languages — "Envoyer un message" opens compose screen
8. **Certifications:** list

### Task 8.10 — Dashboard Screens

Create these in `app/(tabs)/compte/` as nested stack screens (add a `_layout.tsx` with `Stack` inside `/(tabs)/compte/`):

**`favoris.tsx` — Favorites:**

- Calls `getFavourites(token)` with `useQuery`
- `FlatList` of property cards (simplified: image, title, price, location, trash icon)
- Trash icon calls `removeFavourite`
- Empty state: "Aucun favori"

**`alertes.tsx` — Alerts:**

- Calls `getAlerts(token)` with `useQuery`
- List of alert cards showing name, filters applied, created date, active badge
- "Nouvelle alerte" FAB (Floating Action Button) opens a `Modal` with the create form
- Create form has: name, listingType picker, category picker, city/suburb inputs, price range, bedrooms range
- Delete swipe action or trash button
- Empty state: "Aucune alerte configurée"

**`demandes.tsx` — Enquiries:**

- Calls `getEnquiries(token)` with `useQuery`
- List of enquiry cards: property name, status badge (En attente/Répondu/Clôturé), message preview, date
- Delete button
- Empty state: "Aucune demande envoyée"

**`avis.tsx` — Reviews:**

- Calls `getMyReviews(token)` with `useQuery`
- Summary card: average rating + breakdown bars
- List of review cards: subject, star rating, comment, date, delete button
- Empty state: "Aucun avis publié"

**`profil.tsx` — Profile:**
Three sections:

1. **Avatar:** `expo-image-picker` to pick photo → calls `uploadAvatar`. Remove button calls `removeAvatar`.
2. **Personal info form:** firstName, lastName, email, phoneNumber → calls `updateMe`
3. **Change password form:** currentPassword, newPassword, confirmPassword → calls `changePassword`
4. **Danger zone:** "Supprimer mon compte" → confirmation modal → calls `deleteAccount` → logout → navigate to home

### Task 8.11 — Blog Screen (`app/(tabs)/...` or linked from home)

Create `app/blog/index.tsx` (blog list) and `app/blog/[slug].tsx` (blog detail).

**Blog list:**

- Import `blogPosts` and `featuredArticle` from a copied `src/lib/blog.ts`
- Horizontal `ScrollView` of category filter chips
- Featured article card (navy background) at top
- `FlatList` of article cards below
- "Voir plus" shows next 6 items (use `visibleCount` state)

**Blog detail:**

- Header: category, tag badge, title, date + read time
- Body: render `content` HTML — use `react-native-render-html` (install: `npm install react-native-render-html`)
- Related articles at bottom
- CTA card: "Trouver un agent"

### Task 8.12 — Conseils Screens

Create `app/conseils/index.tsx` and `app/conseils/[slug].tsx`.

The guide content (guide-acheteur, guide-vendeur, etc.) can be stored in a `src/lib/conseils.ts` file with the same structure as `src/lib/blog.ts` (slug, title, content).

---

## Phase 9 — Utility Hooks

### Task 9.1 — `src/hooks/useProperties.ts`

```ts
import { useQuery } from "@tanstack/react-query";
import { fetchProperties, type PropertyParams } from "../services/properties";

export function useProperties(params: PropertyParams = {}) {
  return useQuery({
    queryKey: ["properties", params],
    queryFn: () => fetchProperties(params),
  });
}
```

### Task 9.2 — `src/hooks/useAgents.ts`

```ts
import { useQuery } from "@tanstack/react-query";
import { fetchAgents, type AgentParams } from "../services/agents";

export function useAgents(params: AgentParams = {}) {
  return useQuery({
    queryKey: ["agents", params],
    queryFn: () => fetchAgents(params),
  });
}
```

### Task 9.3 — `src/hooks/useAgencies.ts`

Same pattern for agencies.

### Task 9.4 — `src/hooks/useDebounce.ts`

```ts
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```

### Task 9.5 — `src/hooks/useAuthGuard.ts`

Redirects to login if not authenticated:

```ts
import { useEffect } from "react";
import { router } from "expo-router";
import { useAuthStore } from "../store/useAuthStore";

export function useAuthGuard() {
  const { isAuthenticated } = useAuthStore();
  useEffect(() => {
    if (!isAuthenticated) router.replace("/(auth)/connexion");
  }, [isAuthenticated]);
  return isAuthenticated;
}
```

---

## Phase 10 — Utility Functions

### Task 10.1 — `src/lib/format.ts`

Copy utility functions from web `src/lib/properties.ts`:

- `formatPrice(price, currency, period)` → returns string like "250 000 $" or "1 500 $/mois"
- `formatListedAgo(days)` → "Hier", "Il y a 3 jours", etc.
- `categoryLabel(category)` → "Appartement", "Villa", etc.

### Task 10.2 — `src/lib/whatsapp.ts`

```ts
import { Linking } from "react-native";

export function openWhatsApp(phone: string, message: string) {
  const cleaned = phone.replace(/\D/g, "");
  const encoded = encodeURIComponent(message);
  Linking.openURL(`https://wa.me/${cleaned}?text=${encoded}`);
}

export function openPhone(phone: string) {
  Linking.openURL(`tel:${phone}`);
}
```

### Task 10.3 — `src/lib/share.ts`

```ts
import * as Clipboard from "expo-clipboard";
import { Share } from "react-native";

export async function shareProperty(propertyId: string, title: string) {
  const url = `https://okapi-realestate.cd/property/${propertyId}`;
  try {
    await Share.share({ title, message: `${title}\n${url}`, url });
  } catch {
    await Clipboard.setStringAsync(url);
  }
}
```

---

## Phase 11 — Additional Configuration

### Task 11.1 — TypeScript path aliases

Create `tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Update `babel.config.js` to add `babel-plugin-module-resolver`:

```bash
npm install --save-dev babel-plugin-module-resolver
```

```js
plugins: [
  [
    "module-resolver",
    {
      root: ["./src"],
      alias: { "@": "./src" },
    },
  ],
];
```

### Task 11.2 — Error boundary

Create `app/+not-found.tsx`:

```tsx
import { Link, Stack } from "expo-router";
import { View, Text } from "react-native";

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: "Page introuvable" }} />
      <View className="flex-1 items-center justify-center bg-background-alt p-6">
        <Text className="text-6xl font-bold text-primary">404</Text>
        <Text className="text-xl font-semibold text-text-dark mt-4">
          Page introuvable
        </Text>
        <Link href="/" className="mt-8 text-primary underline">
          Retour à l'accueil
        </Link>
      </View>
    </>
  );
}
```

---

## Phase 12 — Build Order (execute in sequence)

Claude must build the app in this exact order to avoid import errors:

1. ✅ Bootstrap project (Phase 1)
2. ✅ Types (Phase 2)
3. ✅ Services (Phase 3)
4. ✅ Stores (Phase 4)
5. ✅ UI components: Button, Input, Card, Badge, Avatar, StarRating, Loader, EmptyState (Phase 5)
6. ✅ Root layout + Tab layout (Phase 6 tasks 6.1 and 6.2)
7. ✅ Property components: PropertyCard, PropertyFilters, SearchBar (Phase 7)
8. ✅ Agent components: AgentCard, AgencyCard (nested in Phase 8.4)
9. ✅ Home screen (Phase 8.1)
10. ✅ Auth screens (Phase 8.6)
11. ✅ Acheter screen (Phase 8.2)
12. ✅ Louer screen (Phase 8.3)
13. ✅ Agents screen (Phase 8.4)
14. ✅ Compte screen (Phase 8.5)
15. ✅ Property detail screen (Phase 8.7)
16. ✅ Agent detail screen (Phase 8.8)
17. ✅ Agency detail screen (Phase 8.9)
18. ✅ Dashboard screens (Phase 8.10)
19. ✅ Blog screens (Phase 8.11)
20. ✅ Conseils screens (Phase 8.12)
21. ✅ Hooks (Phase 9)
22. ✅ Utility functions (Phase 10)
23. ✅ Configuration (Phase 11)

---

## Phase 13 — Common Pitfalls to Avoid

1. **Never use `window`, `document`, or `localStorage`** — these are browser APIs. Use `AsyncStorage`, `Linking`, `Platform` from React Native.
2. **Never use `<img>` tags** — use `<Image>` from `expo-image`.
3. **Never use `<a>` or `<Link href>` from next/link** — use `<Link>` from `expo-router` or `router.push()`.
4. **Never use `<div>`, `<span>`, `<p>`** — use `<View>`, `<Text>` from `react-native`.
5. **Never use `onClick`** — use `onPress`.
6. **Always wrap `Text` content in `<Text>` components** — React Native throws if text is not in a Text element.
7. **NativeWind className on `View`/`Text` works** but NOT on every third-party component. For third-party components, use the `style` prop instead.
8. **Fonts must be loaded before rendering** — the `useFonts` hook with `SplashScreen.preventAutoHideAsync()` handles this in the root layout.
9. **Safe area insets** — always wrap top-level screens with `<SafeAreaView>` from `react-native-safe-area-context`.
10. **Avatar upload on mobile** — uses `expo-image-picker` and sends `FormData` with `{ uri, name, type }` instead of a `File` object.
11. **Images from the backend** — the backend stores relative paths like `uploads/avatars/file.jpg`. Prefix with `API_URL` when displaying: `{ uri: \`${API_URL}/${user.profileImage}\` }`.
12. **Tailwind class purging** — dynamic classes (like `bg-blue-600`) must be declared in the `tailwind.config.js` safelist or used in a static string.

---

## Phase 14 — Running & Testing

```bash
# Start development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Run on physical device
# Install Expo Go app, scan QR code from `npx expo start`
```

**Testing checklist (verify each before marking done):**

- [ ] App launches without crash
- [ ] Fonts render correctly (DM Sans)
- [ ] Home screen loads with property data
- [ ] Acheter/Louer screens filter and paginate
- [ ] Property detail opens, images scroll, WhatsApp button works
- [ ] Login flow works end-to-end (token stored in AsyncStorage)
- [ ] Register flow works
- [ ] Favorites add/remove works (requires auth)
- [ ] Profile update works
- [ ] Avatar upload picks image and updates
- [ ] Alerts create/delete works
- [ ] Enquiry submission works
- [ ] Blog list filters by category
- [ ] Blog article renders HTML content
- [ ] Agent list loads and filters
- [ ] Agent detail shows properties
- [ ] Share button copies URL

---

## Phase 15 — Production Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS (requires Apple Developer account)
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## File Tree Summary

```
okapi-real-estate-mobile/
├── app/
│   ├── _layout.tsx                    # Root layout + fonts + QueryProvider
│   ├── +not-found.tsx                 # 404 screen
│   ├── (tabs)/
│   │   ├── _layout.tsx                # Bottom tab navigator
│   │   ├── index.tsx                  # Home screen
│   │   ├── acheter.tsx                # Buy properties list
│   │   ├── louer.tsx                  # Rent properties list
│   │   ├── agents.tsx                 # Agents + agencies list
│   │   └── compte/
│   │       ├── _layout.tsx            # Account stack
│   │       ├── index.tsx              # Account menu (or login prompt)
│   │       ├── profil.tsx             # Profile + avatar + password
│   │       ├── favoris.tsx            # Saved properties
│   │       ├── alertes.tsx            # Property alerts
│   │       ├── demandes.tsx           # Enquiries
│   │       └── avis.tsx               # Reviews
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── connexion.tsx              # Login
│   │   ├── inscription.tsx            # Register
│   │   └── mot-de-passe-oublie.tsx    # Forgot password
│   ├── property/
│   │   └── [id].tsx                   # Property detail
│   ├── agents/
│   │   └── [id].tsx                   # Agent detail
│   ├── agences/
│   │   └── [id].tsx                   # Agency detail
│   ├── blog/
│   │   ├── index.tsx                  # Blog list
│   │   └── [slug].tsx                 # Article detail
│   └── conseils/
│       ├── index.tsx                  # Guides list
│       └── [slug].tsx                 # Guide detail
├── src/
│   ├── components/
│   │   ├── QueryProvider.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── StarRating.tsx
│   │   │   ├── Loader.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── property/
│   │   │   ├── PropertyCard.tsx
│   │   │   ├── PropertyFilters.tsx
│   │   │   └── SearchBar.tsx
│   │   └── agent/
│   │       ├── AgentCard.tsx
│   │       └── AgencyCard.tsx
│   ├── constants/
│   │   ├── colors.ts
│   │   ├── layout.ts
│   │   └── api.ts
│   ├── hooks/
│   │   ├── useProperties.ts
│   │   ├── useAgents.ts
│   │   ├── useAgencies.ts
│   │   ├── useDebounce.ts
│   │   └── useAuthGuard.ts
│   ├── lib/
│   │   ├── format.ts
│   │   ├── whatsapp.ts
│   │   ├── share.ts
│   │   └── blog.ts                   # Copy from web app src/lib/blog.ts
│   ├── services/
│   │   ├── auth.ts
│   │   ├── properties.ts
│   │   ├── agents.ts
│   │   └── agencies.ts
│   ├── store/
│   │   └── useAuthStore.ts
│   └── types/
│       ├── property.ts
│       ├── agent.ts
│       ├── agency.ts
│       └── user.ts
├── assets/
│   ├── icon.png                       # 1024x1024 app icon
│   ├── splash.png                     # Splash screen
│   └── adaptive-icon.png              # Android adaptive icon
├── global.css
├── tailwind.config.js
├── babel.config.js
├── metro.config.js
├── nativewind-env.d.ts
├── tsconfig.json
├── app.json
└── .env
```

`
