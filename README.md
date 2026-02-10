# Grosz do Grosza — frontend + backend AI (OpenAI)

Repozytorium zawiera aplikację frontendową (React + Vite) oraz backend Node.js/Express.
Backend udostępnia endpointy AI i komunikuje się z API OpenAI.

> Projekt jest przeznaczony do celów demonstracyjnych/prototypowych.

## Wymagania

* Node.js 18+ oraz npm.
* Klucz API OpenAI (`OPENAI_API_KEY`).

Nie potrzebujesz już:
* `gcloud` CLI,
* konfiguracji Vertex AI,
* ADC (`gcloud auth application-default login`).

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

### Znaczenie kluczowych zmiennych AI

* `OPENAI_MODEL` — model używany przez backend.
* `AI_MODEL_TEMPERATURE` — losowość odpowiedzi (`0-2`).
* `AI_MODEL_MAX_TOKENS` — limit długości odpowiedzi.
* `AI_MODEL_TIMEOUT_MS` — timeout żądania do OpenAI.
* `PROMPT_VERSION` — wersja promptów widoczna w logach diagnostycznych.

## Instalacja i uruchamianie

Z katalogu głównego:

```bash
npm install
npm run dev
```

To uruchamia równolegle:
* frontend: `http://localhost:5173`
* backend: `http://127.0.0.1:5000`

### Uruchamianie osobno

Backend:

```bash
npm run dev-backend
```

Frontend:

```bash
npm run dev-frontend
```

## Endpointy backendu AI

Backend wystawia endpointy pod prefiksem `/api/ai`:

* `POST /api/ai/advice` — porady finansowe na podstawie transakcji i celów.
* `POST /api/ai/parse-document` — ekstrakcja transakcji z dokumentu (`pdf`, `jpg`, `png`, `webp`, `txt`).

### Jak frontend trafia do backendu

W trybie deweloperskim Vite proxuje żądania `/api/ai/*` na backend (`http://localhost:5000`).
Dzięki temu frontend wywołuje po prostu lokalne ścieżki:

* `/api/ai/advice`
* `/api/ai/parse-document`

## Migracja danych/konfiguracji

Jeśli wcześniej używałeś konfiguracji Google Cloud / Vertex:

1. Usuń stare zmienne (jeśli występują) z `backend/.env.local`, np.:
   * `GOOGLE_CLOUD_PROJECT`
   * `GOOGLE_CLOUD_LOCATION`
   * inne zmienne specyficzne dla Vertex/ADC
2. Dodaj `OPENAI_API_KEY` i (opcjonalnie) dopasuj `OPENAI_MODEL`.
3. Zrestartuj backend po zmianach env (`Ctrl+C` i ponownie `npm run dev-backend` / `npm run dev`).

### Dane użytkownika

Dane aplikacji (transakcje, cele itp.) są trzymane lokalnie w IndexedDB po stronie przeglądarki,
więc migracja dostawcy AI nie usuwa danych użytkownika.
