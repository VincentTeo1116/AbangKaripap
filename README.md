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

##  How It Works

┌─────────────────────────────────────────────────────────────────────────┐
│                            USER INTERFACE                               │
│                    (React Web App / Browser Extension)                  │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           INPUT METHODS                                 │
│                                                                         │
│   ┌─────────────────────┐              ┌─────────────────────────────┐  │
│   │      TEXT INPUT     │              │         IMAGE INPUT         │  │
│   │  Paste news article │              │  Upload screenshot/photo    │  │
│   │  or headline        │              │  (JPG, PNG, GIF)            │  │
│   └─────────────────────┘              └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND API (FastAPI)                         │
│                              http://localhost:8000                      │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                                   │
                    ▼                                   ▼
    ┌───────────────────────────┐       ┌───────────────────────────────┐
    │   TEXT DETECTION          │       │   IMAGE DETECTION             │
    │   /detect/text            │       │   /detect/image/fakenews      │
    │                           │       │                               │
    │   Direct AI analysis      │       │   1. Google Vision API (OCR)  │
    │   without preprocessing   │       │   2. Extract text from image  │
    └───────────────────────────┘       │   3. Then send to AI          │
                                        └───────────────────────────────┘
                    │                                   │
                    └─────────────────┬─────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        GOOGLE GEMINI AI (Analysis)                      │
│                                                                         │
│   The AI analyzes the text using a structured prompt framework:         │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  FAKE NEWS DETECTION PROMPT                                     │   │
│   │  ─────────────────────────────────────────────────────────────  │   │
│   │  • Source evaluation (Are claims verifiable?)                   │   │
│   │  • Language analysis (Emotional manipulation?)                  │   │
│   │  • Factual consistency (Logical contradictions?)                │   │
│   │  • Context assessment (Balanced information?)                   │   │
│   │  • Red flag identification                                      │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  CLICKBAIT DETECTION PROMPT                                     │   │
│   │  ─────────────────────────────────────────────────────────────  │   │
│   │  • Emotional manipulation check                                 │   │
│   │  • Information-promise gap                                      │   │
│   │  • Curiosity exploitation                                       │   │
│   │  • Linguistic patterns (All caps, superlatives)                 │   │
│   │  • Manipulative techniques                                      │   │
│   └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           AI RESPONSE (JSON)                            │
│                                                                         │
│   {                                                                     │
│     "prediction": "Fake" / "Not Fake",                                  │
│     "confidence": 85,                                                   │
│     "explanation": "This text contains sensational language...",        │
│     "key_points": [                                                     │
│       "Lacks verifiable sources",                                       │
│       "Uses emotional manipulation",                                    │
│       "Contains contradictory claims."                                  │
│     ]                                                                   │
│   }                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          RESULT DISPLAY                                 │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  Fake News Detection                                            │   │
│   │  ─────────────────────────────────────────────────────────────  │   │
│   │  Prediction: Fake                                               │   │
│   │  Confidence: 85%                                                │   │
│   │                                                                 │   │
│   │  Explanation:                                                   │   │
│   │  This text contains sensational language and lacks credibility  │   │
│   │  sources. The claims are unverifiable...                        │   │
│   │                                                                 │   │
│   │  Key Points:                                                    │   │
│   │  • Lacks verifiable sources                                     │   │
│   │  • Uses emotional manipulation                                  │   │
│   │  • Contains contradictory claims                                │   │
│   └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     OPTIONAL: SAVE TO HISTORY (Firebase)                │
│                                                                         │
│   If user is logged in, the detection result is automatically saved     │
│   to Firestore with timestamp, allowing users to revisit past checks.   │
└─────────────────────────────────────────────────────────────────────────┘
