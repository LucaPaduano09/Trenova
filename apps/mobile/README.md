# Mobile

Base Expo/React Native per l'app cliente Trenova.

## Obiettivo

`apps/mobile` e una client app per i clienti dei personal trainer.
La logica di business resta nel backend web; il mobile consuma endpoint dedicati in `apps/web/app/api/mobile/*`.

## Variabili ambiente

Imposta `EXPO_PUBLIC_API_BASE_URL` con l'URL del backend web.

Esempi:

- iOS simulator: `http://localhost:3000`
- Android emulator: `http://10.0.2.2:3000`
- dispositivo reale: `http://<ip-locale-macchina>:3000`

## Avvio

```bash
pnpm install
pnpm dev:mobile
```
