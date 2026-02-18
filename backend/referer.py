# test_vision_with_referer.py
import requests
import base64

GOOGLE_API_KEY = "AIzaSyAR2r_C2jJFXH9fIOS8UUhbTvZw6gM0Adw"

# 测试图片（1x1像素透明PNG）
test_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

# 尝试不同的 Referer
referers = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://localhost",
    None  # 无 Referer
]

url = f"https://vision.googleapis.com/v1/images:annotate?key={GOOGLE_API_KEY}"

for i, referer in enumerate(referers):
    print(f"\n测试 {i+1}: Referer = {referer}")
    
    headers = {'Content-Type': 'application/json'}
    if referer:
        headers['Referer'] = referer
    
    request_body = {
        "requests": [
            {
                "image": {
                    "content": test_image
                },
                "features": [
                    {
                        "type": "TEXT_DETECTION"
                    }
                ]
            }
        ]
    }
    
    try:
        response = requests.post(url, json=request_body, headers=headers)
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ 成功！")
            break
        else:
            result = response.json()
            error_msg = result.get('error', {}).get('message', '未知错误')
            print(f"❌ 失败: {error_msg}")
    except Exception as e:
        print(f"❌ 错误: {e}")