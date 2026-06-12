# Deployment Guide — Okapi Real Estate (iOS)

How to ship this app to TestFlight (beta) and the App Store (production) using EAS.

## Key facts

| Item | Value |
|---|---|
| Framework | Expo SDK 55 + EAS Build/Submit |
| Bundle ID | `com.okapi.realestate` |
| Apple Team ID | `YBHH4R48C5` (Individual — Jordy Tshibangu) |
| Apple ID | `jordytshibangu1@gmail.com` |
| EAS project | `@jordytshibangu/okapi-real-estate` (`6010ebbc-d6b3-4f35-bfef-0dad2c42f919`) |
| Expo dashboard | https://expo.dev/accounts/jordytshibangu/projects/okapi-real-estate |
| App Store Connect | https://appstoreconnect.apple.com |
| Version source | Remote (EAS auto-increments build numbers; `ios.buildNumber` in app.json is ignored) |

## Build profiles (eas.json)

| Profile | Distribution | Backend (`EXPO_PUBLIC_API_URL`) | Purpose |
|---|---|---|---|
| `development` | internal | `https://api-dev.okapi-real-estate.com` | Dev client for local development |
| `preview` | internal | `https://api-qa.okapi-real-estate.com` | Ad-hoc internal builds (not TestFlight) |
| `testflight` | store (extends production) | `https://api-qa.okapi-real-estate.com` | TestFlight beta builds |
| `production` | store | `https://api.okapi-real-estate.com` | App Store release builds |

**Important:** `EXPO_PUBLIC_*` variables are baked into the binary at build time. Changing a URL in eas.json requires a **new build** — it cannot be changed after the fact. TestFlight only accepts store-distribution builds (`testflight` or `production` profiles).

---

## 1. Prerequisites (one-time, already done)

1. Apple Developer Program membership (Individual).
2. App ID `com.okapi.realestate` registered at developer.apple.com → Identifiers (explicit, no extra capabilities).
3. App record "Okapi Real Estate" created in App Store Connect.
4. EAS CLI installed and logged in: `npm install -g eas-cli && eas login`.
5. Distribution certificate + provisioning profile — generated and stored remotely by EAS on first build (valid until June 2027). Nothing to manage manually.
6. `ITSAppUsesNonExemptEncryption: false` set in app.json — skips the export-compliance question on every upload.

## 2. TestFlight deployment

### 2.1 Build and submit

```bash
eas build --platform ios --profile testflight
eas submit --platform ios --latest
```

- Build runs on Expo's servers (~15–25 min), no Mac/Xcode required.
- Build number auto-increments (remote version source).
- `eas submit` uploads the .ipa to App Store Connect; Apple processing takes 10–30 min.

### 2.2 Verify the upload

1. App Store Connect → Okapi Real Estate → **TestFlight** → iOS Builds: new build appears as "Processing", then becomes available.
2. TestFlight app on iPhone shows the new build number (e.g. "1.0.0 (4)").
3. To confirm the backend: watch QA API server logs while browsing the app.

### 2.3 Internal testing (instant, no review)

- TestFlight → Internal Testing group ("Okapi Real Estate Tester").
- Internal testers must be **App Store Connect users** (Users and Access → invite with Developer/App Manager role, they accept the email). Max 100.
- New builds reach internal testers immediately after processing.

### 2.4 External testing (any email, needs review)

- TestFlight → External Testing group: add any email address (max 10,000) or share the **public link**.
- The **first build** (and significantly changed ones) requires **Beta App Review** (~24h).
- Status meanings:
  - **No Builds Available** — build not yet approved by Beta App Review, or no build assigned to the group.
  - **Invited** — tester received the invite but hasn't installed.
  - **Installed** — tester has the app.
- Test Information required once: beta description, feedback email, contact info, and a **working demo account** (must exist on the backend the build points to — currently QA). A broken demo login is the most common rejection.
- "What to Test" notes are required per submitted build.

### 2.5 Shipping a new beta build

```bash
eas build --platform ios --profile testflight
eas submit --platform ios --latest
```

That's the whole loop. Internal testers: automatic. External testers: usually a quick re-review, then auto-notified.

### 2.6 Builds expire

TestFlight builds expire **90 days** after upload. Push a new build before expiry if beta continues.

## 3. Production (App Store) deployment

### 3.1 One-time App Store listing setup

In App Store Connect → Distribution (App Store tab), prepare:

1. **Screenshots** — 6.7" (1290×2796) required; 6.5" optional. Real app screens, no device frames required.
2. **Description, keywords, promotional text, support URL.**
3. **Privacy Policy URL** — `https://okapi-real-estate.com/confidentialite`.
4. **App Privacy** section — declare data collected: account info (email), location (used for nearby listings), photos (profile picture), and how data is used. Must match what the app actually does.
5. **Age rating questionnaire.**
6. **Pricing** — Free, plus territory availability.
7. **App Review Information** — contact details + the demo account (must work on the **production** backend this time).

### 3.2 Build and submit for release

```bash
eas build --platform ios --profile production
eas submit --platform ios --latest
```

This build points at `https://api.okapi-real-estate.com`. **Never release a testflight-profile build to the App Store** — it targets QA.

### 3.3 Submit for App Review

1. App Store Connect → Distribution → "+" next to iOS App → select the new version (e.g. 1.0.0).
2. Attach the processed build, fill "What's New" (first release: brief description).
3. Choose release option:
   - **Manually release** — you press the button after approval (recommended for v1).
   - **Automatically release** after approval.
   - **Phased release** — gradual rollout over 7 days (for updates).
4. Submit. Review typically takes 24–48 h.

### 3.4 Possible review outcomes

- **Approved** → release (manual or automatic). Live on the App Store within ~24 h of release.
- **Rejected** → reason appears in App Store Connect with reviewer messages. Common causes:
  - Demo account doesn't work or backend is down → fix account/server, reply in Resolution Center (no new build needed).
  - Generic/missing permission strings → already handled (custom location + photos strings in app.json).
  - Bugs/crashes during review → fix, build, submit new binary.
  - Metadata issues (screenshots not matching app) → fix metadata only, resubmit without new build.
- **In Review > 48h** — normal occasionally; you can contact Apple via "Contact Us" if stuck for a week.

### 3.5 Releasing updates after v1

1. Bump `version` in app.json (e.g. `1.1.0`) — build number is automatic.
2. Beta-test via the TestFlight flow (section 2).
3. When stable: `eas build --profile production` + `eas submit`.
4. Create the new version in App Store Connect, attach build, "What's New", submit for review.

For pure JS bug fixes you can optionally use **EAS Update** (OTA updates, no review needed) — not currently configured; requires `expo-updates`.

## 4. Version & build number rules

- `version` (app.json, e.g. `1.0.0`) — user-facing marketing version. Bump manually for each App Store release.
- `buildNumber` — managed remotely by EAS (`autoIncrement: true`), unique per upload. The `ios.buildNumber` field in app.json is ignored and can be removed.
- A given marketing version can have many build numbers (TestFlight iterations); App Review approves one of them.

## 5. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| "No Builds Available" for external testers | Build still in Beta App Review, or not assigned to the group. Wait, or assign build to group. |
| Tester didn't get invite | Internal: not added in Users and Access / didn't accept. External: check spam, or resend; or use the public link. |
| Build rejected for demo login | Account must exist and work on the backend baked into that build (QA for testflight profile, prod for production profile). |
| App shows wrong/empty data in TestFlight | The build targets QA — check `eas.json` profile env and QA server status. |
| `eas submit` asks for ascAppId | Let it prompt and select the existing app, or add `"ascAppId"` to `submit.production.ios` (numeric Apple ID of the app, visible in App Store Connect → App Information). |
| Build fails on credentials | Run `eas credentials` to inspect/regenerate certificates. |
| Expo dashboard says "Create your first build" | Stale onboarding checklist — ignore; check the project's Builds tab. |

## 6. Quick reference

```bash
# TestFlight beta
eas build --platform ios --profile testflight
eas submit --platform ios --latest

# App Store production
eas build --platform ios --profile production
eas submit --platform ios --latest

# Useful
eas build:list --platform ios --limit 5   # recent builds
eas credentials                            # inspect certs/profiles
eas whoami                                 # check login
```
