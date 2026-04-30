# 🔍 ABANG KARIPAP - AI-Powered Fake News Detector

[Web Page Demo](https://karipapfakenews.netlify.app)
[Backend Server](https://abang-karipap-api.onrender.com)

**ABANG KARIPAP** is an intelligent, AI-powered fake news detection system designed to help users identify misinformation in both text and images. Named with a friendly, approachable identity, ABANG KARIPAP acts as your personal fact-checking companion in the battle against fake news.

🔗 **Live Demo:** [https://karipapfakenews.netlify.app](https://karipapfakenews.netlify.app)

---

## Features

| Feature | Description |
|---------|-------------|
| **Text Analysis** | Paste any news article or headline to receive an instant verdict — Fake or Not Fake — along with a confidence score and detailed explanation |
| **Image Analysis** | Upload screenshots or photos containing text; Google Vision API extracts the content for AI-powered analysis |
| **Clickbait Detection** | Identify misleading headlines and sensationalized content designed to grab attention |
| **Browser Extension** | One-click detection directly on any news page — no copy-paste, no tab switching |
| **User History** | Optional login via Firebase saves detection history, allowing users to track past analyses |
| **Multi-Language** | Supports English, Malay (BM), and Chinese (中文) |
| **Real-Time Results** | FastAPI backend ensures low-latency responses for seamless user experience |

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React** | User interface framework |
| **CSS3** | Styling and animations |
| **Firebase Auth** | User authentication (optional) |
| **Firestore** | Detection history storage |

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance Python web framework |
| **Google Gemini AI** | Fake news and clickbait detection |
| **Google Vision API** | OCR text extraction from images |
| **Uvicorn** | ASGI server |

### Deployment
| Platform | Purpose |
|----------|---------|
| **Netlify** | Frontend hosting |
| **Render** | Backend API hosting |

---
┌─────────────────────────────────────────────────────────────────────────┐
│                     OPTIONAL: SAVE TO HISTORY (Firebase)                │
│                                                                         │
│   If user is logged in, the detection result is automatically saved     │
│   to Firestore with timestamp, allowing users to revisit past checks.   │
└─────────────────────────────────────────────────────────────────────────┘
