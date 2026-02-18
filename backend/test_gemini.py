# test_with_working_model.py
import requests
import json

API_KEY = "AIzaSyAYEo4TmLluSKf8iTycM1JmW42ngVSCY5A"
model = "models/gemini-2.5-flash"  # 这个确定可用

def test_fake_news_detection():
    """用确定可用的模型测试假新闻检测"""
    
    url = f"https://generativelanguage.googleapis.com/v1beta/{model}:generateContent?key={API_KEY}"
    
    test_news = """
    震惊！科学家发现每天喝咖啡可以延长寿命20年！
    最新研究显示，每天饮用3杯咖啡的人比不喝咖啡的人平均多活20年。
    这项研究跟踪了10万名志愿者长达30年时间。
    """
    
    prompt = f"""
    你是一个专业的假新闻检测专家。请分析以下新闻文本，判断它是否是假新闻。
    
    新闻文本：
    {test_news}
    
    请以 JSON 格式返回结果，包含以下字段：
    1. prediction: 只能是 "Fake" 或 "Not Fake"
    2. explanation: 详细解释为什么这样判断（中文）
    3. confidence: 置信度（0-100之间的数字）
    4. key_points: 关键判断点列表
    
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
    
    print(f"正在调用模型: {model}")
    print("-" * 50)
    
    try:
        response = requests.post(url, json=payload)
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            # 提取响应文本
            if 'candidates' in result:
                text_response = result['candidates'][0]['content']['parts'][0]['text']
                print("\n✅ Gemini 响应:")
                print(text_response)
                
                # 尝试解析 JSON
                try:
                    start = text_response.find('{')
                    end = text_response.rfind('}') + 1
                    if start != -1 and end > start:
                        json_str = text_response[start:end]
                        parsed = json.loads(json_str)
                        print("\n📊 解析结果:")
                        print(f"预测: {parsed.get('prediction')}")
                        print(f"解释: {parsed.get('explanation')}")
                        print(f"置信度: {parsed.get('confidence')}%")
                        if parsed.get('key_points'):
                            print("关键点:")
                            for point in parsed['key_points']:
                                print(f"  • {point}")
                except:
                    pass
        elif response.status_code == 429:
            print("❌ 配额超限，请等待一分钟后再试")
            print("错误详情:", response.json())
        else:
            print(f"❌ 错误: {response.text}")
            
    except Exception as e:
        print(f"❌ 异常: {e}")

if __name__ == "__main__":
    test_fake_news_detection()