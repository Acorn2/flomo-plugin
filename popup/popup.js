import { ZhipuAIService } from '../services/ai/index.js';
import { AIServiceFactory, AIServiceType } from '../services/ai/index.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 初始化时获取主题
  const { theme } = await chrome.storage.sync.get('theme');
  if (theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  // 监听存储变化而不是消息
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.theme) {
      const newTheme = changes.theme.newValue;
      document.documentElement.setAttribute('data-theme', newTheme || 'default');
    }
  });

  // 获取存储的设置
  const settings = await chrome.storage.sync.get(['webhookUrl', 'defaultTag']);
  const FLOMO_API = settings.webhookUrl;
  const DEFAULT_TAG = settings.defaultTag || '#Chrome阅读笔记'; // 设置默认值


  // 如果没有配置 Webhook URL，显示警告提示
  if (!FLOMO_API) {
    // 显示错误消息
    showMessage('请先在设置页面配置 Webhook URL', 'error');
    
    // 添加警告提示条
    const warningDiv = document.createElement('div');
    warningDiv.className = 'warning-message';
    warningDiv.innerHTML = `
      <div class="warning-content">
        ⚠️ 请先配置 Webhook URL
        <button class="config-btn">去配置</button>
      </div>
    `;

    // 插入到提交按钮之前
    const submitBtn = document.getElementById('submit');
    submitBtn.parentNode.insertBefore(warningDiv, submitBtn);
    
    // 禁用提交按钮
    submitBtn.disabled = true;
    submitBtn.title = '请先配置 Webhook URL';
    
    // 为配置按钮添加点击事件
    warningDiv.querySelector('.config-btn').addEventListener('click', async () => {
      await chrome.runtime.openOptionsPage();
      window.close();
    });
  }

  // 获取当前标签页信息并填充到对应输入框
  chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
    const currentTab = tabs[0];
    document.getElementById('title').value = currentTab.title || '';
    document.getElementById('link').value = currentTab.url || '';
  });


  // 字数统计功能
  function updateCharCount(elementId) {
    const textarea = document.getElementById(elementId);
    if (!textarea) return;
    
    // 找到对应的字数统计元素
    const countSpan = textarea.parentElement.querySelector('.char-count');
    if (!countSpan) {
      // 如果不存在字数统计元素，创建一个
      const span = document.createElement('span');
      span.className = 'char-count';
      textarea.parentElement.appendChild(span);
    }
    
    const count = textarea.value.length;
    const maxLength = textarea.maxLength;
    
    // 更新字数统计显示
    const countElement = textarea.parentElement.querySelector('.char-count');
    if (countElement) {
      countElement.textContent = `${count}/${maxLength}`;
    }
  }

  // 为摘要和感想输入框添加字数统计
  const textareas = ['summary', 'thoughts'];
  
  textareas.forEach(id => {
    const textarea = document.getElementById(id);
    if (textarea) {
      // 初始化字数统计
      updateCharCount(id);
      
      // 添加输入事件监听
      textarea.addEventListener('input', () => {
        updateCharCount(id);
      });
    }
  });


  // 修改设置按钮的选择器
  const settingsBtn = document.querySelector('button.icon-btn.settings-btn');
  console.log('找到设置按钮:', settingsBtn);

  if (!settingsBtn) {
    console.error('未找到设置按钮元素');
    return;
  }

  settingsBtn.addEventListener('click', async () => {
    console.log('设置按钮被点击');
    try {
      await chrome.runtime.openOptionsPage();
      window.close();
    } catch (error) {
      console.error('打开设置页面失败:', error);
    }
  });

  // 提交按钮事件
  document.getElementById('submit').addEventListener('click', async () => {
    // 获取所有输入内容
    const title = document.getElementById('title').value;
    const link = document.getElementById('link').value;
    const summary = document.getElementById('summary').value;
    const thoughts = document.getElementById('thoughts').value;

    // 组装发送内容，按照特定格式
    const contentParts = [];
    
    // 添加标题
    if (title) {
      contentParts.push(title);
    }

    // 添加链接 - 使用小括号包裹
    if (link) {
      contentParts.push(`(${link})`);
    }

    // 添加原文摘要 - 如果有内容，添加标题和内容
    if (summary) {
      contentParts.push('\n原文摘要：\n\n' + summary);
    }

    // 添加个人感想 - 如果有内容，添加标题和内容
    if (thoughts) {
      contentParts.push('\n个人感想：\n\n' + thoughts);
    }

    // 添加标签 - 使用存储的默认标签
    contentParts.push(`\n${DEFAULT_TAG}`);

    // 将所有部分用换行符连接
    const content = contentParts.join('\n');

    try {
      const response = await fetch(FLOMO_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content })
      });

      if (response.ok) {
        // 显示成功弹窗
        showToast('笔记已保存到 Flomo', 'success');
        
        // 清空输入框，但保留标题和链接
        document.getElementById('summary').value = '';
        document.getElementById('thoughts').value = '';
        updateCharCount('summary');
        updateCharCount('thoughts');
      } else {
        showToast('发送失败，请重试', 'error');
      }
    } catch (error) {
      showToast('发送失败，请检查网络连接', 'error');
    }
  });

  // 添加键盘快捷键监听
  document.addEventListener('keydown', (e) => {
    // 防止在输入框内按Ctrl+Enter触发两次提交
    if (e.target.tagName === 'TEXTAREA' && (e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
    }
    
    // 提交快捷键：Ctrl/Command + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('submit').click();
    }
    
    // 清空快捷键：Ctrl/Command + Shift + X
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'X') {
      e.preventDefault();
      document.getElementById('clear').click();
    }
  });

  // 添加关闭按钮功能
  document.querySelector('.close-btn').addEventListener('click', () => {
    window.close();
  });

  // 获取 AI 配置信息
  async function getAIConfig() {
    try {
      const settings = await chrome.storage.sync.get(['aiService', 'apiKey']);
      return {
        service: settings.aiService || 'zhipu', // 默认使用智谱 AI
        apiKey: settings.apiKey || ''
      };
    } catch (error) {
      console.error('获取 AI 配置失败:', error);
      throw new Error('获取 AI 配置失败');
    }
  }

  // AI 总结功能
  async function summarizeText() {
    const summaryTextarea = document.getElementById('summary');
    let textToSummarize = summaryTextarea.value.trim();

    // 如果文本框为空，则尝试获取页面内容
    if (!textToSummarize) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const [{ result }] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: getPageContent
        });
        
        if (result) {
          textToSummarize = result;
        } else {
          showMessage('未能获取到页面内容', 'error');
          return;
        }
      } catch (error) {
        console.error('获取页面内容失败:', error);
        showMessage('获取页面内容失败，请手动输入或复制内容', 'error');
        return;
      }
    }

    const aiBtn = document.querySelector('.ai-btn');
    const originalBtnText = aiBtn.innerHTML;
    
    aiBtn.innerHTML = '<span class="ai-icon">⏳</span>正在总结...';
    aiBtn.disabled = true;

    try {
      const { service, apiKey } = await getAIConfig();
      
      if (!apiKey) {
        showMessage('请先在设置页面配置对应服务的 API Key', 'error');
        return;
      }

      const aiService = AIServiceFactory.create(service, apiKey);
      const prompt = `#输入：\n\n${textToSummarize}`;
      const summary = await aiService.summarize(prompt);
      
      summaryTextarea.value = summary;
      updateCharCount('summary');
      showMessage('AI总结完成！', 'success');

    } catch (error) {
      handleAIError(error);
    } finally {
      aiBtn.innerHTML = originalBtnText;
      aiBtn.disabled = false;
    }
  }

  // 添加错误处理函数
  function handleAIError(error) {
    console.error('AI 总结失败:', error);
    
    if (error.message.includes('API Key')) {
      showMessage('API Key无效或已过期，请检查设置', 'error');
    } else if (error.message.includes('network')) {
      showMessage('网络连接失败，请检查网络设置', 'error');
    } else {
      showMessage(`AI服务错误: ${error.message}`, 'error');
    }
  }

  // 添加按钮点击事件
  document.querySelector('.ai-btn').addEventListener('click', summarizeText);

  // 添加标签页切换监听
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    window.close();
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      window.close();
    }
  });
});

// 获取页面内容的函数
function getPageContent() {
  // 获取主要内容
  const article = document.querySelector('article') || document.querySelector('main') || document.body;
  
  // 移除不需要的元素
  const clonedArticle = article.cloneNode(true);
  const elementsToRemove = clonedArticle.querySelectorAll('script, style, nav, header, footer, iframe, .ad, .advertisement, .social-share');
  elementsToRemove.forEach(el => el.remove());
  
  // 获取所有段落文本
  const paragraphs = Array.from(clonedArticle.querySelectorAll('p, h1, h2, h3, h4, h5, h6'))
    .map(el => el.textContent.trim())
    .filter(text => text.length > 0);
  
  // 如果没有找到段落，尝试获取选中的文本
  if (paragraphs.length === 0) {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      return selectedText;
    }
    // 如果没有选中的文本，获取可见的文本内容
    return Array.from(clonedArticle.querySelectorAll('*'))
      .map(el => el.textContent.trim())
      .filter(text => text.length > 0)
      .join('\n');
  }
  
  // 合并段落，添加适当的分隔
  return paragraphs.join('\n\n');
}

// 显示消息提示
function showMessage(message, type) {
  const messageDiv = document.createElement('div');
  messageDiv.textContent = message;
  messageDiv.className = `message ${type}`;
  document.body.appendChild(messageDiv);

  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}

// 添加 Toast 提示函数
function showToast(message, type = 'info') {
  // 移除可能存在的旧 toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // 根据类型选择图标
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
    </div>
  `;
  
  document.body.appendChild(toast);

  // 添加显示动画
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // 3秒后自动消失
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
} 