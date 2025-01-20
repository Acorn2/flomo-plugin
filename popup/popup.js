document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM Content Loaded');

  // 添加这些调试代码
  console.log('所有按钮元素:', document.querySelectorAll('button')); // 查看所有按钮
  console.log('所有带有 class 的元素:', document.querySelectorAll('[class]')); // 查看所有带类名的元素

  // 获取存储的设置
  const settings = await chrome.storage.sync.get(['webhookUrl', 'defaultTag']);
  const FLOMO_API = settings.webhookUrl;
  const DEFAULT_TAG = settings.defaultTag || '#Chrome阅读笔记'; // 设置默认值

  // 如果没有配置 Webhook URL，提示用户配置
  if (!FLOMO_API) {
    showMessage('请先在设置页面配置 Webhook URL', 'error');
    return;
  }

  // 获取当前标签页信息并填充到对应输入框
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
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
        showMessage('保存成功！', 'success');
        // 清空输入框，但保留标题和链接
        document.getElementById('summary').value = '';
        document.getElementById('thoughts').value = '';
        updateCharCount('summary');
        updateCharCount('thoughts');
      } else {
        showMessage('发送失败，请重试', 'error');
      }
    } catch (error) {
      showMessage('发送失败，请检查网络连接', 'error');
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

  // AI 总结按钮功能（如果需要）
  document.querySelector('.ai-btn').addEventListener('click', () => {
    // 添加 AI 总结功能
    console.log('AI 总结功能待实现');
  });
});

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