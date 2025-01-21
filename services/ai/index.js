import ZhipuAIService from './zhipu.js';
import DeepseekAIService from './deepseek.js';

// AI服务类型枚举
export const AIServiceType = {
  ZHIPU: 'zhipu',
  DEEPSEEK: 'deepseek'
};

// AI服务工厂
export class AIServiceFactory {
  static create(type, apiKey) {
    switch (type) {
      case AIServiceType.ZHIPU:
        return new ZhipuAIService(apiKey);
      case AIServiceType.DEEPSEEK:
        return new DeepseekAIService(apiKey);
      default:
        throw new Error(`未知的AI服务类型: ${type}`);
    }
  }
}

export {
  ZhipuAIService,
  DeepseekAIService
};

// 添加 API Key 验证功能
export async function validateAPIKey(service, apiKey) {
  try {
    const aiService = AIServiceFactory.create(service, apiKey);
    // 发送一个简单的测试请求
    await aiService.summarize('测试文本');
    return true;
  } catch (error) {
    return false;
  }
}

// 添加服务状态检查
export async function checkAIServiceStatus() {
  const { service, apiKey } = await getAIConfig();
  if (!apiKey) {
    return {
      available: false,
      message: '未配置API Key'
    };
  }
  
  const isValid = await validateAPIKey(service, apiKey);
  return {
    available: isValid,
    message: isValid ? '服务可用' : 'API Key无效'
  };
}

// 添加获取AI配置的统一方法
export async function getAIConfig() {
  const { aiService } = await chrome.storage.sync.get('aiService');
  const service = aiService || AIServiceType.ZHIPU; // 默认使用智谱AI
  const keyName = `${service}ApiKey`;
  const { [keyName]: apiKey } = await chrome.storage.sync.get(keyName);
  
  return {
    service,
    apiKey
  };
} 