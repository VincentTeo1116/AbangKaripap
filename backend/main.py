from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import requests
import json
import logging
from typing import Optional

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS 设置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 开发环境允许所有来源
    allow_methods=["*"],
    allow_credentials=True,
    allow_headers=["*"],
)

# 配置 API 密钥
GOOGLE_VISION_KEY = "AIzaSyAR2r_C2jJFXH9fIOS8UUhbTvZw6gM0Adw"
GEMINI_API_KEY = "AIzaSyAYEo4TmLluSKf8iTycM1JmW42ngVSCY5A"

# 数据模型
class TextNewsItem(BaseModel):
    text: str
    input_type: str = "text"

class ImageNewsItem(BaseModel):
    image: str
    input_type: str = "image"

def ocr_with_google_vision(image_base64):
    """使用 Google Vision API 进行 OCR（修复 referer 问题）"""
    url = f"https://vision.googleapis.com/v1/images:annotate?key={GOOGLE_VISION_KEY}"
    
    # 关键：添加 referer header 匹配你在 Google Cloud 中设置的域名
    headers = {
        'Content-Type': 'application/json',
        'Referer': 'http://localhost:3000'  # 匹配你的前端地址
    }
    
    request_body = {
        "requests": [
            {
                "image": {
                    "content": image_base64
                },
                "features": [
                    {
                        "type": "TEXT_DETECTION"
                    }
                ],
                "imageContext": {
                    "languageHints": ["zh", "en"]
                }
            }
        ]
    }
    
    try:
        logger.info("调用 Google Vision API...")
        logger.info(f"使用 Referer: {headers['Referer']}")
        
        response = requests.post(url, json=request_body, headers=headers, timeout=30)
        
        if response.status_code == 403:
            logger.error("Vision API 403 错误 - 可能是 referer 限制")
            # 尝试不带 referer 重试（如果 API 密钥设置为无限制）
            headers_no_referer = {'Content-Type': 'application/json'}
            response = requests.post(url, json=request_body, headers=headers_no_referer, timeout=30)
        
        result = response.json()
        
        if response.status_code != 200:
            error_msg = result.get('error', {}).get('message', '未知错误')
            logger.error(f"Vision API 错误 ({response.status_code}): {error_msg}")
            
            # 特别处理 referer 错误
            if "referer" in error_msg.lower():
                return "OCR失败: 请在 Google Cloud Console 中设置 API 密钥的网站限制为允许 http://localhost:3000"
            
            return f"OCR失败: {error_msg}"
        
        if 'responses' in result and result['responses'][0]:
            text_annotation = result['responses'][0].get('textAnnotations', [])
            if text_annotation:
                extracted_text = text_annotation[0].get('description', '')
                logger.info(f"OCR成功，识别到 {len(extracted_text)} 字符")
                return extracted_text
        
        return "未在图片中检测到文字"
    
    except Exception as e:
        logger.error(f"OCR错误: {e}")
        return f"OCR处理失败: {str(e)}"

def detect_fake_news_with_gemini(text):
    """使用 Gemini 检测假新闻"""
    model_name = "models/gemini-2.5-flash"
    
    url = f"https://generativelanguage.googleapis.com/v1beta/{model_name}:generateContent?key={GEMINI_API_KEY}"
    
    prompt = f"""
    你是一个专业的假新闻检测专家。请分析以下新闻文本，判断它是否是假新闻。

    新闻文本：
    {text}

    请以 JSON 格式返回结果，包含以下字段：
    1. prediction: 只能是 "Fake" 或 "Not Fake"
    2. explanation: 详细解释为什么这样判断（中文）
    3. confidence: 置信度（0-100之间的数字）
    4. key_points: 关键判断点列表（数组格式）

    只返回 JSON，不要有其他文字。
    """
    
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ]
    }
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    try:
        logger.info(f"调用 Gemini 模型: {model_name}")
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 429:
            logger.warning("Gemini 配额超限")
            return {
                "prediction": "Unknown",
                "explanation": "API 配额已超限，请稍后再试",
                "confidence": 0,
                "key_points": ["服务暂时不可用，请等待几分钟"]
            }
        
        if response.status_code != 200:
            logger.error(f"Gemini API 错误: {response.text}")
            return {
                "prediction": "Error",
                "explanation": f"API 调用失败: {response.status_code}",
                "confidence": 0,
                "key_points": []
            }
        
        result = response.json()
        
        if 'candidates' in result and len(result['candidates']) > 0:
            text_response = result['candidates'][0]['content']['parts'][0]['text']
            
            try:
                start = text_response.find('{')
                end = text_response.rfind('}') + 1
                if start != -1 and end > start:
                    json_str = text_response[start:end]
                    parsed = json.loads(json_str)
                    
                    return {
                        "prediction": parsed.get("prediction", "Unknown"),
                        "explanation": parsed.get("explanation", "无法分析"),
                        "confidence": parsed.get("confidence", 0),
                        "key_points": parsed.get("key_points", [])
                    }
            except:
                pass
            
            return {
                "prediction": "Unknown",
                "explanation": text_response[:500],
                "confidence": 0,
                "key_points": []
            }
        
        return {
            "prediction": "Error",
            "explanation": "无法获取响应",
            "confidence": 0,
            "key_points": []
        }
        
    except Exception as e:
        logger.error(f"Gemini 调用失败: {e}")
        return {
            "prediction": "Error",
            "explanation": f"AI 分析失败: {str(e)}",
            "confidence": 0,
            "key_points": []
        }

@app.get("/")
async def root():
    return {
        "message": "假新闻检测 API",
        "endpoints": [
            "/health",
            "/detect_fake",
            "/detect_fake_from_image",
            "/test_google_ocr"
        ]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "vision_api": "configured",
        "gemini_api": "configured",
        "message": "服务器正常运行"
    }

@app.post("/detect_fake")
async def detect_fake_news(news: TextNewsItem):
    """处理文字输入"""
    logger.info(f"收到文字检测请求")
    
    if not news.text.strip():
        return {
            "input_type": "text",
            "prediction": "Error",
            "explanation": "请输入要检测的文本",
            "confidence": 0,
            "key_points": []
        }
    
    result = detect_fake_news_with_gemini(news.text)
    
    return {
        "input_type": "text",
        "original_text": news.text[:200] + "..." if len(news.text) > 200 else news.text,
        "prediction": result["prediction"],
        "explanation": result["explanation"],
        "confidence": result["confidence"],
        "key_points": result["key_points"]
    }

@app.post("/detect_fake_from_image")
async def detect_fake_from_image(news: ImageNewsItem):
    """处理图片输入"""
    logger.info("收到图片检测请求")
    
    try:
        base64.b64decode(news.image)
    except:
        return {
            "input_type": "image",
            "prediction": "Error",
            "explanation": "无效的图片数据",
            "confidence": 0,
            "key_points": []
        }
    
    # OCR 识别
    ocr_text = ocr_with_google_vision(news.image)
    logger.info(f"OCR 结果: {ocr_text[:100]}...")
    
    if ocr_text.startswith("OCR失败"):
        return {
            "input_type": "image",
            "ocr_text": ocr_text,
            "prediction": "Error",
            "explanation": ocr_text,
            "confidence": 0,
            "key_points": []
        }
    
    if ocr_text == "未在图片中检测到文字":
        return {
            "input_type": "image",
            "ocr_text": ocr_text,
            "prediction": "Unknown",
            "explanation": "图片中未检测到文字，无法判断",
            "confidence": 0,
            "key_points": []
        }
    
    # Gemini 检测
    result = detect_fake_news_with_gemini(ocr_text)
    
    return {
        "input_type": "image",
        "ocr_text": ocr_text[:500] + "..." if len(ocr_text) > 500 else ocr_text,
        "ocr_length": len(ocr_text),
        "prediction": result["prediction"],
        "explanation": result["explanation"],
        "confidence": result["confidence"],
        "key_points": result["key_points"]
    }

@app.post("/test_google_ocr")
async def test_google_ocr(news: ImageNewsItem):
    """测试 OCR 功能"""
    logger.info("测试 Google Vision OCR...")
    
    try:
        base64.b64decode(news.image)
    except:
        return {
            "success": False,
            "error": "无效的图片数据"
        }
    
    extracted_text = ocr_with_google_vision(news.image)
    
    return {
        "success": not extracted_text.startswith("OCR失败"),
        "ocr_result": extracted_text,
        "length": len(extracted_text)
    }