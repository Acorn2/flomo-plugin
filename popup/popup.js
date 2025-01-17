// Flomo API 地址
const FLOMO_API = 'https://flomoapp.com/iwh/MjE0MjQyNQ/60fdac850fa4a0fcbbddf6f445d01667/';

document.addEventListener('DOMContentLoaded', async () => {
  // 获取当前标签页信息并填充标题和链接
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const titleAndLinkText = `${tab.title}\n${tab.url}`;
  document.getElementById('titleAndLink').value = titleAndLinkText;

  // 设置字数统计监听
  setupCharCount('summary');
  setupCharCount('thoughts');

  // 提交按钮事件
  document.getElementById('submit').addEventListener('click', async () => {
    const titleAndLink = document.getElementById('titleAndLink').value;
    const summary = document.getElementById('summary').value;
    const thoughts = document.getElementById('thoughts').value;

    // 组装发送内容
    const content = [
      `【原文】：${titleAndLink}`,
      `【摘要】：${summary}`,
      `【感想】：${thoughts}`
    ].join('\n\n');

    try {
      const response = await fetch(FLOMO_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content })
      });

      if (response.ok) {
        showMessage('发送成功！', 'success');
        // 清空摘要和感想
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

// 设置字数统计
function setupCharCount(elementId) {
  const textarea = document.getElementById(elementId);
  textarea.addEventListener('input', () => updateCharCount(elementId));
  updateCharCount(elementId);
}

// 更新字数统计
function updateCharCount(elementId) {
  const textarea = document.getElementById(elementId);
  const count = textarea.value.length;
  const maxLength = textarea.maxLength;
  textarea.nextElementSibling.textContent = `${count}/${maxLength}`;
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