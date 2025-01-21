// 智谱AI服务实现
class ZhipuAIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
  }

  async summarize(text) {
    console.log('Zhipu AI 服务调用开始');
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'glm-4-flash',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的文本总结助手。请简明扼要地总结用户输入的文本，突出重点。输出要简洁且结构化。'
            },
            {
              role: 'user',
              content: `${text}`
            }
          ],
          top_p: 0.7,
          temperature: 0.95,
          max_tokens: 4095,
          stream: false
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `API请求失败: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
      
    } catch (error) {
      if (error.message.includes('invalid_api_key')) {
        throw new Error('API Key 无效或已过期');
      }
      if (!navigator.onLine) {
        throw new Error('网络连接失败');
      }
      throw new Error(`智谱AI调用失败: ${error.message}`);
    }
  }
}

export default ZhipuAIService; 