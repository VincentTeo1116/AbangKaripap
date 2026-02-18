// frontend/src/App.js
import React, { useState } from 'react';
import './App.css';

function App() {
  // 状态管理
  const [inputType, setInputType] = useState('text'); // 'text' 或 'image'
  const [newsText, setNewsText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');
  const [activeTab, setActiveTab] = useState('fake'); // 'fake' 或 'clickbait'

  // 处理图片选择
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 检查文件大小（限制在5MB以内）
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB');
        return;
      }
      
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }

      setSelectedImage(file);
      
      // 创建预览URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // 清空之前的OCR状态
      setOcrStatus('');
    }
  };

  // 将图片转换为base64（移除头部信息）
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // 移除base64头部的 "data:image/png;base64," 部分，只保留纯base64字符串
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // 清除选择的图片
  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setOcrStatus('');
  };

  // 处理文字检测（假新闻）
  const handleTextDetect = async () => {
    if (!newsText.trim()) {
      alert('请输入要检测的新闻文本');
      return;
    }

    setLoading(true);
    setOcrStatus('');
    setResult(null);
    
    try {
      const response = await fetch('http://localhost:8000/detect_fake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: newsText,
          input_type: 'text'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('出错了:', error);
      setResult({ 
        input_type: 'text',
        prediction: "Error", 
        explanation: "无法连接到后端服务器。请确保后端服务已启动。",
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理图片检测（假新闻）
  const handleImageDetect = async () => {
    if (!selectedImage) {
      alert('请先选择一张图片');
      return;
    }

    setLoading(true);
    setOcrStatus('正在使用 Google Vision API 识别图片中的文字...');
    setResult(null);

    try {
      // 将图片转换为base64
      const base64Image = await getBase64(selectedImage);

      const response = await fetch('http://localhost:8000/detect_fake_from_image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          image: base64Image,
          input_type: 'image'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      
      if (data.ocr_text && !data.ocr_text.startsWith('OCR识别失败')) {
        setOcrStatus('✅ OCR识别完成！');
      } else if (data.ocr_text === '未在图片中检测到文字') {
        setOcrStatus('⚠️ 图片中未检测到文字');
      } else {
        setOcrStatus('❌ OCR识别失败');
      }
      
    } catch (error) {
      console.error('出错了:', error);
      setResult({ 
        input_type: 'image',
        prediction: "Error", 
        explanation: "图片处理失败。请确保后端服务已启动。",
        error: error.message
      });
      setOcrStatus('❌ 处理失败');
    } finally {
      setLoading(false);
    }
  };

  // 测试OCR功能（单独测试Google Vision）
  const testOCR = async () => {
    if (!selectedImage) {
      alert('请先选择一张图片');
      return;
    }

    setLoading(true);
    setOcrStatus('正在测试 Google Vision OCR...');

    try {
      const base64Image = await getBase64(selectedImage);

      const response = await fetch('http://localhost:8000/test_google_ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.ocr_result && !data.ocr_result.startsWith('OCR识别失败')) {
        setOcrStatus(`✅ Google Vision 测试成功！识别到 ${data.length} 个字符`);
        // 显示识别结果在临时区域
        alert(`OCR识别结果：\n${data.ocr_result}`);
      } else {
        setOcrStatus(`❌ OCR测试失败：${data.ocr_result}`);
      }
      
    } catch (error) {
      console.error('OCR测试失败:', error);
      setOcrStatus('❌ OCR测试失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 检查后端健康状态
  const checkBackendHealth = async () => {
    try {
      const response = await fetch('http://localhost:8000/health');
      const data = await response.json();
      alert(`后端状态：${data.status}\nGoogle Vision: ${data.google_vision_api}`);
    } catch (error) {
      alert('无法连接到后端服务器');
    }
  };

  return (
    <div className="App" style={{ 
      padding: '20px', 
      maxWidth: '900px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>
        📰 假新闻检测器
      </h1>
      
      {/* 功能切换标签 */}
      <div style={{ 
        display: 'flex', 
        marginBottom: '30px',
        borderBottom: '2px solid #ddd'
      }}>
        <button 
          onClick={() => setActiveTab('fake')}
          style={{ 
            padding: '10px 20px',
            backgroundColor: activeTab === 'fake' ? '#007bff' : 'transparent',
            color: activeTab === 'fake' ? 'white' : '#666',
            border: 'none',
            borderBottom: activeTab === 'fake' ? '3px solid #007bff' : 'none',
            cursor: 'pointer',
            fontSize: '16px',
            flex: 1
          }}
        >
          🕵️ 假新闻检测
        </button>
        <button 
          onClick={() => setActiveTab('clickbait')}
          style={{ 
            padding: '10px 20px',
            backgroundColor: activeTab === 'clickbait' ? '#007bff' : 'transparent',
            color: activeTab === 'clickbait' ? 'white' : '#666',
            border: 'none',
            borderBottom: activeTab === 'clickbait' ? '3px solid #007bff' : 'none',
            cursor: 'pointer',
            fontSize: '16px',
            flex: 1
          }}
        >
          🎣 标题党检测
        </button>
      </div>

      {/* 假新闻检测界面 */}
      {activeTab === 'fake' && (
        <>
          {/* 输入类型切换 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            marginBottom: '20px',
            gap: '10px'
          }}>
            <button 
              onClick={() => setInputType('text')}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: inputType === 'text' ? '#007bff' : '#f0f0f0',
                color: inputType === 'text' ? 'white' : 'black',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              📝 文字输入
            </button>
            <button 
              onClick={() => setInputType('image')}
              style={{ 
                padding: '10px 20px',
                backgroundColor: inputType === 'image' ? '#007bff' : '#f0f0f0',
                color: inputType === 'image' ? 'white' : 'black',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              🖼️ 图片输入
            </button>
          </div>

          {/* 文字输入区域 */}
          {inputType === 'text' && (
            <div style={{ marginBottom: '20px' }}>
              <textarea
                rows="10"
                style={{ 
                  width: '100%', 
                  padding: '15px',
                  fontSize: '16px',
                  borderRadius: '5px',
                  border: '1px solid #ddd',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                value={newsText}
                onChange={(e) => setNewsText(e.target.value)}
                placeholder="把新闻文字粘贴在这里..."
              />
              <br />
              <button 
                onClick={handleTextDetect}
                disabled={loading}
                style={{
                  padding: '12px 30px',
                  fontSize: '16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '10px',
                  width: '100%'
                }}
              >
                {loading ? '检测中...' : '🔍 检测新闻'}
              </button>
            </div>
          )}

          {/* 图片输入区域 */}
          {inputType === 'image' && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                border: '2px dashed #ddd',
                padding: '30px',
                textAlign: 'center',
                borderRadius: '10px',
                backgroundColor: '#fafafa',
                position: 'relative'
              }}>
                {!imagePreview ? (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      style={{ marginBottom: '10px' }}
                      id="image-input"
                    />
                    <p style={{ color: '#999', marginTop: '10px' }}>
                      支持 JPG、PNG、GIF 格式，最大 5MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <img 
                      src={imagePreview} 
                      alt="预览" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '300px',
                        borderRadius: '5px'
                      }} 
                    />
                    <button
                      onClick={clearImage}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        cursor: 'pointer',
                        fontSize: '18px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* OCR状态显示 */}
              {ocrStatus && (
                <div style={{ 
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#e7f3ff',
                  borderRadius: '5px',
                  color: '#004085',
                  fontSize: '14px'
                }}>
                  {ocrStatus}
                </div>
              )}

              <div style={{ 
                marginTop: '10px',
                display: 'flex',
                gap: '10px'
              }}>
                <button 
                  onClick={handleImageDetect}
                  disabled={loading || !selectedImage}
                  style={{
                    padding: '12px',
                    fontSize: '16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: (loading || !selectedImage) ? 'not-allowed' : 'pointer',
                    flex: 2
                  }}
                >
                  {loading ? '处理中...' : '🔍 检测图片新闻'}
                </button>
                
                <button 
                  onClick={testOCR}
                  disabled={loading || !selectedImage}
                  style={{
                    padding: '12px',
                    fontSize: '16px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: (loading || !selectedImage) ? 'not-allowed' : 'pointer',
                    flex: 1
                  }}
                >
                  📝 测试OCR
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 标题党检测界面（待开发） */}
      {activeTab === 'clickbait' && (
        <div style={{ 
          textAlign: 'center', 
          padding: '50px',
          backgroundColor: '#f8f9fa',
          borderRadius: '10px'
        }}>
          <h2 style={{ color: '#666' }}>🎣 标题党检测</h2>
          <p style={{ color: '#999' }}>
            此功能正在开发中，敬请期待...
          </p>
        </div>
      )}

      {/* 结果显示区域 */}
      {result && (
        <div style={{ 
          marginTop: '30px',
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '10px',
          backgroundColor: '#f8f9fa'
        }}>
          <h2 style={{ marginTop: 0, color: '#333' }}>检测结果:</h2>
          
          {/* 显示输入类型 */}
          <div style={{ 
            display: 'inline-block',
            padding: '5px 10px',
            backgroundColor: result.input_type === 'image' ? '#6c757d' : '#007bff',
            color: 'white',
            borderRadius: '3px',
            fontSize: '14px',
            marginBottom: '15px'
          }}>
            {result.input_type === 'image' ? '🖼️ 图片输入' : '📝 文字输入'}
          </div>
          
          {/* 如果是图片输入且OCR成功，显示OCR结果 */}
          {result.input_type === 'image' && result.ocr_text && !result.ocr_text.startsWith('OCR识别失败') && result.ocr_text !== '未在图片中检测到文字' && (
            <div style={{ 
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#fff3cd',
              borderRadius: '5px',
              border: '1px solid #ffeeba'
            }}>
              <strong style={{ color: '#856404' }}>📝 OCR识别结果:</strong>
              <p style={{ 
                marginTop: '10px',
                marginBottom: 0,
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '3px',
                maxHeight: '200px',
                overflowY: 'auto',
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#333'
              }}>
                {result.ocr_text}
              </p>
              <small style={{ color: '#856404', marginTop: '5px', display: 'block' }}>
                共识别 {result.ocr_length || result.ocr_text.length} 个字符
              </small>
            </div>
          )}
          
          {/* 判断结果 */}
          <div style={{ 
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '5px',
            marginBottom: '15px'
          }}>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>
              <strong>判断：</strong>
            </div>
            <div style={{ 
              fontSize: '24px',
              fontWeight: 'bold',
              color: result.prediction === 'Fake' ? '#dc3545' : 
                     result.prediction === 'Not Fake' ? '#28a745' :
                     result.prediction === '错误' ? '#6c757d' : '#ffc107'
            }}>
              {result.prediction === 'Fake' && '❌ 假新闻'}
              {result.prediction === 'Not Fake' && '✅ 真实新闻'}
              {result.prediction === '错误' && '⚠️ 处理出错'}
              {result.prediction === '未知' && '❓ 无法判断'}
              {result.prediction === 'Error' && '🔴 系统错误'}
            </div>
          </div>
          
          {/* 解释 */}
          {result.explanation && (
            <div style={{ 
              padding: '15px',
              backgroundColor: 'white',
              borderRadius: '5px'
            }}>
              <strong>📋 解释：</strong>
              <p style={{ marginTop: '10px', marginBottom: 0, lineHeight: '1.6' }}>
                {result.explanation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 底部工具栏 */}
      <div style={{ 
        marginTop: '30px',
        padding: '10px',
        borderTop: '1px solid #eee',
        display: 'flex',
        justifyContent: 'center',
        gap: '10px'
      }}>
        <button
          onClick={checkBackendHealth}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🏥 检查后端状态
        </button>
        <small style={{ color: '#999', alignSelf: 'center' }}>
          Powered by Google Vision API
        </small>
      </div>
    </div>
  );
}

export default App;