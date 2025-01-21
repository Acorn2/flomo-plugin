import ThemeManager from '../utils/themeManager.js';

// 初始化页面
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化主题管理器
  const themeManager = new ThemeManager();
  await themeManager.init();

  // 添加主题切换事件监听
  document.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', () => {
      const themeName = card.dataset.theme;
      themeManager.applyTheme(themeName);
    });
  });
  
  // 加载已保存的设置
  loadSettings();
  
  // 保存按钮事件监听
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  
  // 快捷键修改帮助按钮事件
  document.querySelector('.btn-secondary').addEventListener('click', () => {
    // Chrome 不允许直接打开 chrome:// URLs，所以显示提示
    showMessage('请在浏览器地址栏输入: chrome://extensions/shortcuts', 'info');
  });

  // 添加密码显示/隐藏功能
  document.querySelector('.toggle-password').addEventListener('click', function() {
    const apiKeyInput = document.getElementById('apiKey');
    const type = apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
    apiKeyInput.setAttribute('type', type);
    
    // 更新图标（可选）
    this.innerHTML = type === 'password' ? 
      '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" /></svg>' :
      '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.08L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.74,7.13 11.35,7 12,7Z" /></svg>';
  });

  // 处理快捷键设置按钮点击
  document.getElementById('viewShortcutBtn').addEventListener('click', () => {
    // 尝试打开 Chrome 快捷键设置页面
    chrome.tabs.create({
      url: 'chrome://extensions/shortcuts'
    }).catch(() => {
      // 如果直接打开失败（Chrome 不允许直接打开 chrome:// URLs），
      // 显示引导信息
      showShortcutInstructions();
    });
  });

  // 监听 AI 服务切换
  const aiService = document.getElementById('aiService');
  aiService.addEventListener('change', handleServiceChange);
  
  // 初始加载保存的 API Key
  handleServiceChange();
});

// 保存设置到 Chrome 存储
async function saveSettings() {
  const webhookUrl = document.getElementById('webhookUrl');
  const defaultTag = document.getElementById('defaultTag');
  const apiKey = document.getElementById('apiKey');
  const aiService = document.getElementById('aiService');

  resetErrors();

  // 验证必填字段
  if (!webhookUrl.value.trim() || !apiKey.value.trim()) {
    !webhookUrl.value.trim() && showFieldError(webhookUrl, '请输入 Webhook URL');
    !apiKey.value.trim() && showFieldError(apiKey, '请输入 API Key');
    return;
  }

  try {
    // 只保存当前选择的服务和对应的 API Key
    await chrome.storage.sync.set({
      webhookUrl: webhookUrl.value.trim(),
      defaultTag: defaultTag.value.trim().startsWith('#') 
        ? defaultTag.value.trim() 
        : `#${defaultTag.value.trim()}`,
      aiService: aiService.value,
      apiKey: apiKey.value.trim()  // 直接保存当前API Key
    });

    showMessage('设置已保存成功！', 'success');
    
  } catch (error) {
    console.error('保存设置失败:', error);
    showMessage('保存失败，请重试', 'error');
  }
}

// 添加 API Key 切换处理
async function handleServiceChange() {
  const aiService = document.getElementById('aiService');
  const apiKeyInput = document.getElementById('apiKey');
  
  const keyName = `${aiService.value}ApiKey`;
  const { [keyName]: savedKey } = await chrome.storage.sync.get(keyName);
  
  apiKeyInput.value = savedKey || '';
}

// 显示字段错误
function showFieldError(element, message) {
  element.classList.add('input-error');
  
  // 创建或更新错误消息
  let errorMessage = element.parentElement.querySelector('.error-message');
  if (!errorMessage) {
    errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    element.parentElement.appendChild(errorMessage);
  }
  errorMessage.textContent = message;
}

// 重置所有错误状态
function resetErrors() {
  document.querySelectorAll('.input-error').forEach(element => {
    element.classList.remove('input-error');
  });
  
  document.querySelectorAll('.error-message').forEach(element => {
    element.remove();
  });
}

// 从 Chrome 存储加载设置
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get([
      'webhookUrl', 
      'defaultTag', 
      'aiService',
      'zhipuApiKey',
      'deepseekApiKey'
    ]);
    
    // 填充表单
    document.getElementById('webhookUrl').value = settings.webhookUrl || '';
    document.getElementById('defaultTag').value = settings.defaultTag || '#Chrome阅读笔记';
    
    // 设置 AI 服务选择
    const aiService = document.getElementById('aiService');
    aiService.value = settings.aiService || 'zhipu';
    
    // 根据当前选择的服务显示对应的 API Key
    const apiKey = document.getElementById('apiKey');
    apiKey.value = settings[`${aiService.value}ApiKey`] || '';

    // 监听 AI 服务切换，动态更新 API Key
    aiService.addEventListener('change', () => {
      const selectedService = aiService.value;
      apiKey.value = settings[`${selectedService}ApiKey`] || '';
    });

  } catch (error) {
    console.error('加载设置失败:', error);
    showMessage('加载设置失败', 'error');
  }
}

// 显示消息提示
function showMessage(message, type = 'info') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  messageDiv.innerHTML = `
    <span class="message-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <span class="message-text">${message}</span>
  `;
  
  // 移除可能存在的旧消息
  const oldMessage = document.querySelector('.message');
  if (oldMessage) {
    oldMessage.remove();
  }
  
  document.body.appendChild(messageDiv);
  
  // 3秒后自动消失
  setTimeout(() => {
    messageDiv.classList.add('fade-out');
    setTimeout(() => messageDiv.remove(), 300);
  }, 3000);
}

// 显示快捷键修改指引
function showShortcutInstructions() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>如何修改快捷键</h3>
      <div class="steps">
        <p>1. 在 Chrome 地址栏输入: <code>chrome://extensions/shortcuts</code></p>
        <p>2. 找到 "SnapFlomo" 扩展</p>
        <p>3. 点击输入框并按下你想要设置的快捷键组合</p>
      </div>
      <button class="btn-primary close-modal">知道了</button>
    </div>
  `;
  document.body.appendChild(modal);

  // 添加关闭功能
  modal.querySelector('.close-modal').addEventListener('click', () => {
    modal.remove();
  });

  // 点击模态框外部关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
} 