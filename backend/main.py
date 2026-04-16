from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import logging
import time
import base64
import requests
import json
import os

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Fake News Detector API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000","https://karipapfakenews.netlify.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get API keys from environment variables
GOOGLE_VISION_KEY = os.getenv("GOOGLE_VISION_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Check if API keys are loaded
if not GOOGLE_VISION_KEY:
    logger.warning("GOOGLE_VISION_KEY not found in environment variables")
if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not found in environment variables")

# Pydantic models
class TextNewsRequest(BaseModel):
    text: str

class ImageNewsRequest(BaseModel):
    image: str

# SYSTEM STEP - 1:  DIAGNOSTIC ENDPOINTS 
@app.get("/diagnose/gemini")
async def diagnose_gemini():
    """Check available Gemini models"""
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY}"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            models = response.json().get('models', [])
            model_names = [m['name'].replace('models/', '') for m in models]
            return {
                "status": "success",
                "available_models": model_names,
                "recommended_model": "gemini-2.5-flash",
                "message": "Use 'gemini-2.5-flash' in your API calls"
            }
        else:
            return {"status": "error", "message": response.text}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# SCANNING METHODS: OCR FUNCTION (Only accept google vision currently for better accuracy and language support)
def ocr_with_google_vision(image_base64):
    """Use Google Vision API for OCR"""
    url = f"https://vision.googleapis.com/v1/images:annotate?key={GOOGLE_VISION_KEY}"
    
    headers = {'Content-Type': 'application/json'}
    
    request_body = {
        "requests": [
            {
                "image": {"content": image_base64},
                "features": [{"type": "TEXT_DETECTION"}],
                "imageContext": {"languageHints": ["zh", "en"]}
            }
        ]
    }
    
    try:
        logger.info("Calling Google Vision API...")
        response = requests.post(url, json=request_body, headers=headers, timeout=30)
        result = response.json()
        
        if response.status_code != 200:
            error_msg = result.get('error', {}).get('message', 'Unknown error')
            return {"success": False, "error": error_msg, "text": ""}
        
        if 'responses' in result and result['responses'][0]:
            text_annotation = result['responses'][0].get('textAnnotations', [])
            if text_annotation:
                extracted_text = text_annotation[0].get('description', '')
                return {"success": True, "text": extracted_text, "error": ""}
        
        return {"success": True, "text": "", "error": "No text detected"}
    
    except Exception as e:
        return {"success": False, "error": str(e), "text": ""}

# GEMINI FAKE NEWS DETECTION
def detect_fake_news_with_gemini(text):
    """Use Gemini to detect fake news - Using gemini-2.5-flash model"""
    # Use the correct model name from diagnostic (Tried many models but only 2.5 works, not sure my issue or what?)
    model_name = "gemini-2.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
    
    prompt = f"""You are a professional fact-checker and fake news detection expert with years of experience. Analyze this news text using a systematic verification framework.

TEXT TO ANALYZE:
"{text}"

ANALYSIS FRAMEWORK (apply each step):

1. SOURCE EVALUATION:
   - Does the text cite specific, verifiable sources?
   - Are there authoritative references (experts, institutions, studies)?
   - Is there attribution for claims made?

2. LANGUAGE ANALYSIS:
   - Check for emotional manipulation (outrage, fear, sensationalism)
   - Identify loaded language or exaggerated terms
   - Look for absolute statements ("always," "never," "everyone")
   - Detect clickbait patterns or hyperbolic phrasing

3. FACTUAL CONSISTENCY:
   - Are claims specific and verifiable?
   - Does the text make impossible or highly unlikely claims?
   - Are there internal contradictions?
   - Is the timeline logical and consistent?

4. CONTEXT ASSESSMENT:
   - Does the text provide balanced information?
   - Are there missing key details that would change interpretation?
   - Is it presenting opinion as fact?
   - Does it acknowledge complexity or nuance?

5. RED FLAG IDENTIFICATION:
   - Unsubstantiated conspiracy theories
   - Misrepresentation of scientific consensus
   - False equivalency or false balance
   - Cherry-picked data or statistics
   - Ad hominem attacks or straw man arguments

Now, based on this systematic analysis, provide your verdict in the exact JSON format below. Be specific and reference actual content from the text in your explanation.

{{
    "prediction": "Fake" or "Not Fake" or "Uncertain",
    "confidence": (number 0-100, based on strength of evidence),
    "explanation": "A comprehensive explanation that references specific elements from the text and explains why it's fake/real",
    "key_points": [
        "Specific concerning element or verification point 1",
        "Specific concerning element or verification point 2", 
        "Specific concerning element or verification point 3"
    ]
}}

Important guidelines:
- Use "Uncertain" if the text lacks enough information for a definitive judgment
- Base confidence on: clarity of evidence, presence of verifiable claims, and strength of red flags
- In explanation, explicitly reference words/phrases from the text
- For "Not Fake" predictions, highlight what makes it credible
- For "Fake" predictions, explain exactly what makes it unreliable

Return ONLY the JSON, no additional text."""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    
    headers = {'Content-Type': 'application/json'}
    
    try:
        logger.info(f"Calling Gemini API with model {model_name}...")
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            
            if 'candidates' in result and len(result['candidates']) > 0:
                text_response = result['candidates'][0]['content']['parts'][0]['text']
                
                # Extract JSON from response
                try:
                    # Find JSON in the response (it might be wrapped in markdown code blocks)
                    if '```json' in text_response:
                        text_response = text_response.split('```json')[1].split('```')[0]
                    elif '```' in text_response:
                        text_response = text_response.split('```')[1].split('```')[0]
                    
                    start = text_response.find('{')
                    end = text_response.rfind('}') + 1
                    if start != -1 and end > start:
                        json_str = text_response[start:end]
                        parsed = json.loads(json_str)
                        return {
                            "prediction": parsed.get("prediction", "Unknown"),
                            "confidence": parsed.get("confidence", 0),
                            "explanation": parsed.get("explanation", "No explanation provided"),
                            "key_points": parsed.get("key_points", [])
                        }
                except json.JSONDecodeError as e:
                    logger.error(f"JSON parsing error: {e}")
                
                # Fallback - return raw response
                return {
                    "prediction": "Unknown",
                    "confidence": 0,
                    "explanation": text_response[:500],
                    "key_points": []
                }
        elif response.status_code == 429:
            return {
                "prediction": "Unknown",
                "confidence": 0,
                "explanation": "API quota exceeded. Please try again later.",
                "key_points": ["Quota exceeded"]
            }
        else:
            logger.error(f"Gemini API error: {response.status_code} - {response.text}")
            return {
                "prediction": "Error",
                "confidence": 0,
                "explanation": f"API Error: {response.status_code}",
                "key_points": ["Please check the diagnostic endpoint"]
            }
                
    except Exception as e:
        logger.error(f"Error with Gemini API: {e}")
        return {
            "prediction": "Error",
            "confidence": 0,
            "explanation": f"Error: {str(e)}",
            "key_points": ["Connection error"]
        }

# GEMINI CLICKBAIT DETECTION
def detect_clickbait_with_gemini(text):
    """Use Gemini to detect clickbait - Using gemini-2.5-flash model"""
    model_name = "gemini-2.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
    
    prompt = f"""You are an expert in digital media analysis specializing in clickbait detection. Analyze this headline/text using a comprehensive clickbait assessment framework.

TEXT TO ANALYZE:
"{text}"

CLICKBAIT ASSESSMENT FRAMEWORK:

1. EMOTIONAL MANIPULATION CHECK:
   - Does it provoke strong emotions (shock, anger, curiosity)?
   - Are there emotional trigger words (unbelievable, shocking, mind-blowing)?
   - Does it exploit fear, outrage, or FOMO (fear of missing out)?

2. INFORMATION-PROMISE GAP:
   - Does it promise more information than it delivers?
   - Are there vague but enticing claims?
   - Is the headline misleading relative to what you'd expect?

3. CURIOSITY EXPLOITATION:
   - Does it create curiosity without satisfying it?
   - Uses patterns like "X will make you Y" or "This is what happens when..."
   - Numbered lists that seem arbitrary ("10 reasons why...")

4. LINGUISTIC PATTERNS:
   - All caps or excessive punctuation
   - Superlatives and exaggerations ("the most," "ever," "in history")
   - Direct address to reader ("you won't believe," "you need to see")
   - Absolute statements ("everyone is talking about")

5. MANIPULATIVE TECHNIQUES:
   - Creating false urgency
   - Using mystery without substance
   - Exploiting social proof ("going viral," "everyone's sharing")
   - Making extraordinary claims without evidence

Now analyze the text and provide your assessment in the exact JSON format below. Be specific about what elements contribute to clickbait score.

{{
    "score": (0-100 number, where 0 = legitimate headline, 100 = extreme clickbait),
    "prediction": "Clickbait" or "Not Clickbait",
    "confidence": (0-100 number based on strength of indicators),
    "explanation": "Detailed explanation referencing specific words/phrases that influenced the score",
    "clickbait_elements": [
        "Specific clickbait element identified 1 (quote the text)",
        "Specific clickbait element identified 2 (quote the text)",
        "Specific clickbait element identified 3 (quote the text)"
    ]
}}

Guidelines:
- Score 0-30: Legitimate, informative headline
- Score 31-60: Mild clickbait tendencies
- Score 61-100: Strong clickbait
- In explanation, quote specific words/phrases that are problematic
- Clickbait elements should be concrete, quoted examples from the text

Return ONLY the JSON, no additional text."""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    
    headers = {'Content-Type': 'application/json'}
    
    try:
        logger.info(f"Calling Gemini API for clickbait with model {model_name}...")
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            
            if 'candidates' in result and len(result['candidates']) > 0:
                text_response = result['candidates'][0]['content']['parts'][0]['text']
                
                try:
                    # Extract JSON from response
                    if '```json' in text_response:
                        text_response = text_response.split('```json')[1].split('```')[0]
                    elif '```' in text_response:
                        text_response = text_response.split('```')[1].split('```')[0]
                    
                    start = text_response.find('{')
                    end = text_response.rfind('}') + 1
                    if start != -1 and end > start:
                        json_str = text_response[start:end]
                        parsed = json.loads(json_str)
                        return {
                            "score": parsed.get("score", 0),
                            "prediction": parsed.get("prediction", "Unknown"),
                            "confidence": parsed.get("confidence", 0),
                            "explanation": parsed.get("explanation", ""),
                            "clickbait_elements": parsed.get("clickbait_elements", [])
                        }
                except json.JSONDecodeError:
                    pass
                    
        return {
            "score": 0,
            "prediction": "Unknown",
            "confidence": 0,
            "explanation": "Could not analyze clickbait",
            "clickbait_elements": []
        }
        
    except Exception as e:
        logger.error(f"Clickbait detection failed: {e}")
        return {
            "score": 0,
            "prediction": "Error",
            "confidence": 0,
            "explanation": str(e),
            "clickbait_elements": []
        }

# API ENDPOINTS
@app.get("/")
async def root():
    return {
        "name": "ABANG KARIPAP API",
        "version": "1.0.0",
        "status": "running",
        "model": "gemini-2.5-flash",
        "endpoints": [
            "/health",
            "/detect/text",
            "/detect/image",
            "/diagnose/gemini"
        ]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model": "gemini-2.5-flash",
        "vision_api": "configured",
        "gemini_api": "configured"
    }

@app.post("/detect/text")
async def detect_from_text(request: TextNewsRequest):
    start_time = time.time()
    
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    fake_news_result = detect_fake_news_with_gemini(request.text)
    clickbait_result = detect_clickbait_with_gemini(request.text)
    
    return {
        "input_type": "text",
        "fake_news": fake_news_result,
        "clickbait": clickbait_result,
        "processing_time": round(time.time() - start_time, 2)
    }

@app.post("/detect/image")
async def detect_from_image(request: ImageNewsRequest):
    start_time = time.time()
    
    try:
        base64.b64decode(request.image)
    except:
        raise HTTPException(status_code=400, detail="Invalid image data")
    
    ocr_result = ocr_with_google_vision(request.image)
    
    if not ocr_result["success"]:
        return {
            "input_type": "image",
            "fake_news": {
                "prediction": "Error",
                "confidence": 0,
                "explanation": f"OCR failed: {ocr_result['error']}",
                "key_points": []
            },
            "clickbait": {
                "score": 0,
                "prediction": "Error",
                "confidence": 0,
                "explanation": "OCR failed",
                "clickbait_elements": []
            },
            "ocr_text": "",
            "processing_time": round(time.time() - start_time, 2)
        }
    
    extracted_text = ocr_result["text"]
    
    if not extracted_text.strip():
        return {
            "input_type": "image",
            "fake_news": {
                "prediction": "Unknown",
                "confidence": 0,
                "explanation": "No text detected in image",
                "key_points": []
            },
            "clickbait": {
                "score": 0,
                "prediction": "Unknown",
                "confidence": 0,
                "explanation": "No text detected",
                "clickbait_elements": []
            },
            "ocr_text": "No text detected",
            "processing_time": round(time.time() - start_time, 2)
        }
    
    fake_news_result = detect_fake_news_with_gemini(extracted_text)
    clickbait_result = detect_clickbait_with_gemini(extracted_text)
    
    return {
        "input_type": "image",
        "fake_news": fake_news_result,
        "clickbait": clickbait_result,
        "ocr_text": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text,
        "ocr_length": len(extracted_text),
        "processing_time": round(time.time() - start_time, 2)
    }

# Add these new endpoints to your main.py
@app.post("/detect/text/fakenews")
async def detect_fake_news_from_text(request: TextNewsRequest):
    start_time = time.time()
    
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    fake_news_result = detect_fake_news_with_gemini(request.text)
    
    return {
        "input_type": "text",
        "fake_news": fake_news_result,
        "processing_time": round(time.time() - start_time, 2)
    }

@app.post("/detect/text/clickbait")
async def detect_clickbait_from_text(request: TextNewsRequest):
    start_time = time.time()
    
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    clickbait_result = detect_clickbait_with_gemini(request.text)
    
    return {
        "input_type": "text",
        "clickbait": clickbait_result,
        "processing_time": round(time.time() - start_time, 2)
    }

@app.post("/detect/image/fakenews")
async def detect_fake_news_from_image(request: ImageNewsRequest):
    start_time = time.time()
    
    try:
        base64.b64decode(request.image)
    except:
        raise HTTPException(status_code=400, detail="Invalid image data")
    
    ocr_result = ocr_with_google_vision(request.image)
    
    if not ocr_result["success"]:
        return {
            "input_type": "image",
            "fake_news": {
                "prediction": "Error",
                "confidence": 0,
                "explanation": f"OCR failed: {ocr_result['error']}",
                "key_points": []
            },
            "ocr_text": "",
            "processing_time": round(time.time() - start_time, 2)
        }
    
    extracted_text = ocr_result["text"]
    
    if not extracted_text.strip():
        return {
            "input_type": "image",
            "fake_news": {
                "prediction": "Unknown",
                "confidence": 0,
                "explanation": "No text detected in image",
                "key_points": []
            },
            "ocr_text": "No text detected",
            "processing_time": round(time.time() - start_time, 2)
        }
    
    fake_news_result = detect_fake_news_with_gemini(extracted_text)
    
    return {
        "input_type": "image",
        "fake_news": fake_news_result,
        "ocr_text": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text,
        "ocr_length": len(extracted_text),
        "processing_time": round(time.time() - start_time, 2)
    }