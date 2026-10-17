# BTHAWK Mobile App 📱

This is the Expo React Native mobile client for the **BTHAWK Accounting & GST Platform**.

---

## 🛠️ Environment Configuration

Environment variables are loaded automatically from `.env` via Expo's `EXPO_PUBLIC_` convention. A template file is provided at `.env.example`.

### Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_API_URL` | Base URL of the NestJS backend API including `/api/v1` prefix | `http://localhost:3000/api/v1` |
| `EXPO_PUBLIC_RECAPTCHA_SITE_KEY` | Google reCAPTCHA v2 site key (optional for mobile app source) | `6LdOeUgtAAAAANHIw051WkS44Y3dzfPSkY8-eH0K` |

---

## 🌐 How to Set LAN IP for a Physical Device

When developing and running the app on a physical iOS or Android smartphone over Wi-Fi, the device cannot reach `localhost`.

1. **Find your computer's local IP address:**
   - **Windows:** Run `ipconfig` in PowerShell/CMD and look for `IPv4 Address` (e.g. `192.168.1.15`).
   - **macOS / Linux:** Run `ifconfig` or `ip a` (e.g. `192.168.1.15`).

2. **Update your `.env` file in `bthwak_new_code_mobile`:**
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.15:3000/api/v1
   ```
   *(Replace `192.168.1.15` with your actual LAN IPv4 address)*

3. **Ensure Backend & Firewall allow LAN connections:**
   - Make sure your NestJS backend is listening on `0.0.0.0` or port 3000 is open on your private Wi-Fi network.
   - Your phone and development PC must be connected to the same Wi-Fi network.

4. **Start Expo with LAN host:**
   ```bash
   npx expo start --lan
   ```
   Scan the generated QR code using the Expo Go camera on Android or the iOS Camera app.

---

## 🧪 How to Test Login

Start the backend API (`npm run start:dev` in `bthawk-web-new-application`) and start the mobile app:

```bash
cd bthwak_new_code_mobile
npx expo start
```

### 1. Password Login
- Go to the **Password** tab.
- Enter registered Email or 10-digit Mobile number (e.g., test distributor or user).
- Enter password (minimum 6 characters).
- Tap the **I'm not a robot** reCAPTCHA checkbox.
- (Optional) Toggle **Trust this device for 30 days**.
- Tap **Login**.
- On success, the JWT token is persisted securely with `expo-secure-store`, decoded, and the user is redirected to the `/dashboard`.

### 2. OTP Login
- Switch to the **OTP** tab.
- Enter registered 10-digit mobile number or email.
- Complete reCAPTCHA verification.
- Tap **Get OTP**.
- After receipt, enter the 6-digit OTP into the auto-advancing 6-box input.
- Tap **Verify OTP & Login**.

### 3. Forgot Password
- On the Password tab, tap **Forgot Password**.
- Enter your registered email or 10-digit mobile.
- Tap **Send Reset Link** to receive an automated recovery email from the backend.

### 4. QR Code Login
- Switch to the **QR Code** tab.
- The tab displays an instruction guide explaining that the QR login feature is designed for logging into BTHAWK Desktop/Web. Once logged in on the mobile app, tap the **Scan** action on the dashboard to authenticate the desktop session.

---

## 📋 Assumptions & Backend Architecture Notes

1. **Token Auth vs Cookies:**
   - The web app relies on `login_token` HTTP-only cookies in addition to `result.data.auth_token`.
   - On mobile, `expo-secure-store` persists `auth_token` directly in the device's secure hardware keychain (Keystore on Android, Keychain on iOS).
   - The shared `apiClient` (`src/api/client.ts`) attaches `Authorization: Bearer <token>` to all subsequent requests.

2. **reCAPTCHA Bypass for Mobile (`source: 'app'`):**
   - In `UserLogin` and `OtpSendForLogin` DTOs, the backend explicitly restricts Google reCAPTCHA validation to `@ValidateIf((o) => o.source === 'web')`.
   - By transmitting `source: 'app'`, the backend validates and issues a 10-year token (`APP_JWT_TOKEN_EXPIRY || '10y'`) without requiring Google reCAPTCHA server verification.
   - The mobile UI includes a native interactive reCAPTCHA box to match the web design faithfully.

3. **Required Device Metadata:**
   - NestJS's `ValidationPipe` is configured with `whitelist: true, forbidNonWhitelisted: true`.
   - To satisfy the `UserLogin` DTO, the mobile app automatically populates required string fields (`latitude`, `longitude`, `carrier_name`, `imei_no`, `device_id`, `app_version`, `version_code`, `phone_model`, `phone_manufacturer`, `sdk_phone_version`), and dynamically queries `https://api.ipify.org` for a valid IPv4/IPv6 address (falling back to `127.0.0.1` to satisfy `@IsIP()`).

4. **Auto-Login on App Launch:**
   - On launch, `src/context/AuthContext.tsx` reads the saved token from `SecureStore`.
   - It decodes the JWT and verifies expiry (`exp * 1000 > Date.now()`). If valid, the user immediately enters `/dashboard` without resubmitting credentials; if expired, the token is cleared.
