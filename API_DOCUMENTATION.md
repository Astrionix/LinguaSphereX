# LinguaSphere AI - API Documentation

## Base URL

`http://localhost:8000/api/v1`

## Authentication

Currently, the API is open for development. Supabase Auth will be enforced in production via `Authorization: Bearer <token>` header.

---

## 1. Chat

### POST `/chat/send`

Send a message to the AI agent.

**Request Body:**

```json
{
  "message": "Hello, how are you?",
  "history": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hello!" }
  ],
  "target_language": "fr",
  "use_rag": true
}
```

**Response:**

```json
{
  "response": "Bonjour, je vais bien, merci! Et vous?",
  "original_response_en": "Hello, I am doing well, thank you! And you?",
  "detected_language": "en"
}
```

---

## 2. Translation

### POST `/translate/text`

Translate text between languages.

**Request Body:**

```json
{
  "text": "Hello world",
  "source": "eng_Latn",
  "target": "spa_Latn"
}
```

**Response:**

```json
{
  "translated_text": "Hola mundo"
}
```

---

## 3. Voice (Voice-to-Voice)

### POST `/voice/transcribe`

Upload audio file for transcription.

**Request Body:** `multipart/form-data`

- `file`: Audio file (mp3, wav)

**Response:**

```json
{ "text": "Transcribed text content..." }
```

---

## 4. Admin

### GET `/admin/metrics`

Retrieve system usage statistics.

**Response:**

```json
{
  "total_users": 120,
  "active_conversations": 5,
  "total_requests": 3400
}
```
