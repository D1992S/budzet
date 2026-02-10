# Grosz do Grosza — frontend + backend AI (OpenAI)

Repozytorium zawiera aplikację frontendową (React + Vite) oraz backend Node.js/Express.
Backend udostępnia endpointy AI i komunikuje się z API OpenAI.

> Projekt jest przeznaczony do celów demonstracyjnych/prototypowych.

## Wymagania

* Node.js 18+ oraz npm.
* Klucz API OpenAI (`OPENAI_API_KEY`).

## Struktura projektu

* `frontend/` — aplikacja React (Vite).
* `backend/` — serwer Node.js/Express z endpointami AI.

## Konfiguracja środowiska (OpenAI)

Utwórz plik `backend/.env.local` (jeśli jeszcze nie istnieje) i ustaw:

```env
API_BACKEND_PORT=5000
API_BACKEND_HOST=127.0.0.1
API_PAYLOAD_MAX_SIZE=12mb
API_CORS_ALLOWLIST=http://localhost:5173,http://127.0.0.1:5173
API_RATE_LIMIT_MAX=30
API_RATE_LIMIT_WINDOW_MS=60000

OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
AI_MODEL_TEMPERATURE=0.4
AI_MODEL_MAX_TOKENS=700
AI_MODEL_TIMEOUT_MS=12000
PROMPT_VERSION=2026-02-10.v1
```

## Instalacja (Windows/macOS/Linux)

Kroki są takie same na wszystkich systemach (PowerShell, Terminal, Bash):

```bash
npm install
```

### Start deweloperski (frontend + backend)

```bash
npm run dev
```

Uruchamia równolegle:
* frontend: `http://localhost:5173`
* backend: `http://127.0.0.1:5000`

### Start backendu tylko DEV (z nodemon)

```bash
npm run dev-backend
```

### Start backendu tylko PROD (bez nodemon)

```bash
npm run start-backend
```

### Build frontendu

```bash
npm run build-frontend
```

## Check-start backendu (walidacja env)

Backend ma skrypt startowy, który przed uruchomieniem waliduje konfigurację.
Najważniejsza kontrola to obecność `OPENAI_API_KEY`.

Ręczne wywołanie walidacji:

```bash
npm run check-start --prefix backend
```

Jeśli `OPENAI_API_KEY` nie jest ustawiony, backend kończy działanie z czytelną listą błędów i wskazówką,
co dopisać do `backend/.env.local`.

## Endpointy backendu AI

Backend wystawia endpointy pod prefiksem `/api/ai`:

* `POST /api/ai/advice` — porady finansowe na podstawie transakcji i celów.
* `POST /api/ai/parse-document` — ekstrakcja transakcji z dokumentu (`pdf`, `jpg`, `png`, `webp`, `txt`).

## Endpoint zdrowia `/health`

Backend udostępnia endpoint:

* `GET /health`

Przykładowa odpowiedź:

```json
{
  "status": "ok",
  "serverReady": true,
  "aiConfigured": true,
  "checks": {
    "openAiKeyConfigured": true,
    "aiConfigValid": true,
    "payloadLimitValid": true
  },
  "issues": []
}
```

W przypadku problemu z konfiguracją zwracany jest status `503` i lista `issues`.
Endpoint nie ujawnia sekretów (pokazuje wyłącznie informacje typu `true/false`).

## Backup / restore danych IndexedDB (JSON)

Aplikacja ma widok **Backup danych** w menu bocznym.

### Eksport (backup)
1. Wejdź w zakładkę **Backup danych**.
2. Kliknij **Eksportuj JSON**.
3. Zapisz plik `.json` w bezpiecznym miejscu.

### Import (restore)
1. Wejdź w zakładkę **Backup danych**.
2. Kliknij **Importuj JSON** i wskaż plik backupu.
3. Dane zostaną odtworzone do IndexedDB.

Dzięki temu reinstalacja, zmiana urządzenia lub czyszczenie pamięci przeglądarki nie muszą oznaczać utraty danych.

## Release checklist

Przed wydaniem wykonaj:

1. **Build frontendu**
   * `npm run build-frontend`
2. **Uruchomienie backendu**
   * `npm run start-backend`
3. **Test ścieżki czatu AI**
   * Otwórz aplikację, przejdź do `Asystent AI`, wyślij zapytanie i potwierdź odpowiedź.
4. **Test parsowania dokumentu**
   * Wgraj przykładowy dokument (`pdf`/`jpg`/`png`/`webp`/`txt`) i sprawdź, czy transakcje są poprawnie odczytywane.
5. **Kontrola zdrowia backendu**
   * `curl http://127.0.0.1:5000/health`

## Jak frontend trafia do backendu

W trybie deweloperskim Vite proxuje żądania `/api/ai/*` na backend (`http://localhost:5000`).
Dzięki temu frontend wywołuje lokalne ścieżki:

* `/api/ai/advice`
* `/api/ai/parse-document`
