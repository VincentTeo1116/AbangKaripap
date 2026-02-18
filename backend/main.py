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
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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
    
    prompt = f"""You are a professional fake news detection expert. Analyze this news text and determine if it's fake or real.

News text: {text}

Provide your analysis in this JSON format:
{{
    "prediction": "Fake" or "Not Fake",
    "confidence": (0-100 number),
    "explanation": "Detailed explanation in English",
    "key_points": ["point1", "point2", "point3"]
}}

Only return the JSON, no other text."""

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
    
    prompt = f"""Analyze this headline/text for clickbait characteristics. Determine if it's clickbait and provide a score.

Text: {text}

Return in this JSON format:
{{
    "score": (0-100 number, where 100 is definitely clickbait),
    "prediction": "Clickbait" or "Not Clickbait",
    "confidence": (0-100 number),
    "explanation": "Why it is or isn't clickbait",
    "clickbait_elements": ["element1", "element2"]
}}

Only return JSON."""

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