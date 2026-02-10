# Vertex AI Studio Frontend App with Node.js Backend

This repository contains a frontend and a Node.js backend, designed to run together.
The backend acts as a proxy, handling Google Cloud API calls.

This project is intended for demonstration and prototyping purposes only.
It is not intended for use in a production environment.

## Prerequisites

To run this application locally, you need:

*   **[Google Cloud SDK / gcloud CLI](https://cloud.google.com/sdk/docs/install)**: Follow the instructions to install the SDK.

*   **gcloud Initialization**:
    *   Initialize the gcloud CLI:
        ```bash
        gcloud init
        ```
    *   Authenticate for Application Default Credentials (needed to call Google Cloud APIs):
        ```bash
        gcloud auth application-default login
        ```

*   **Node.js and npm**: Ensure you have Node.js and its package manager, `npm`, installed on your machine.

## Project Structure

The project is organized into two main directories:

*   `frontend/`: Contains the Frontend application code.
*   `backend/`: Contains the Node.js/Express server code to proxy Google Cloud API calls.

## Backend Environment Variables

The `backend/.env.local` file is automatically generated when you download this application.
It contains essential Google Cloud environment variables pre-configured based on your project settings at the time of download.

The variables set in `backend/.env.local` are:
*   `API_BACKEND_PORT`: The port the backend API server listens on (e.g., `5000`).
*   `API_PAYLOAD_MAX_SIZE`: The maximum size of the request payload accepted by the backend server (e.g., `5mb`).
*   `GOOGLE_CLOUD_LOCATION`: The Google Cloud region associated with your project.
*   `GOOGLE_CLOUD_PROJECT`: Your Google Cloud Project ID.

**Note:** These variables are automatically populated during the download process.
You can modify the values in `backend/.env.local` if you need to change them.

## Installation and Running the App

To install dependencies and run your Google Cloud Vertex AI Studio App locally, execute the following command:

```bash
npm install && npm run dev

## Konfiguracja AI backendu

W backendzie parametry modelu są konfigurowane przez zmienne środowiskowe:

* `OPENAI_MODEL` – nazwa modelu.
* `AI_MODEL_TEMPERATURE` – poziom kreatywności/losowości odpowiedzi (0-2).
* `AI_MODEL_MAX_TOKENS` – górny limit długości odpowiedzi.
* `AI_MODEL_TIMEOUT_MS` – timeout zapytania do modelu (ms).
* `PROMPT_VERSION` – wersja promptów widoczna w logach diagnostycznych.

### Wpływ parametrów modelu na koszt i jakość

* **Model (`OPENAI_MODEL`)**
  * Bardziej zaawansowane modele zwykle dają lepszą jakość rozumowania i ekstrakcji danych.
  * Zwykle są też droższe per token i mogą mieć większe opóźnienie.

* **Temperature (`AI_MODEL_TEMPERATURE`)**
  * Niższe wartości (np. `0.0`–`0.3`) dają bardziej deterministyczne i powtarzalne odpowiedzi.
  * Wyższe wartości (np. `0.7`+) zwiększają różnorodność odpowiedzi, ale mogą obniżyć spójność.
  * Temperature sama w sobie nie zwiększa kosztu tokenowego, ale może wpływać na użyteczność odpowiedzi.

* **Max tokens (`AI_MODEL_MAX_TOKENS`)**
  * Bezpośrednio ogranicza maksymalną długość odpowiedzi modelu.
  * Wyższy limit może poprawić kompletność odpowiedzi, ale zwykle zwiększa koszt (więcej tokenów w odpowiedzi).

* **Timeout (`AI_MODEL_TIMEOUT_MS`)**
  * Nie wpływa bezpośrednio na cenę tokenów, ale wpływa na UX i niezawodność.
  * Zbyt niski timeout zwiększa liczbę fallbacków, zbyt wysoki wydłuża oczekiwanie użytkownika przy problemach.
