// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
  // 加载已保存的设置
  loadSettings();
  
  // 保存按钮事件监听
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  
  // 快捷键修改帮助按钮事件
  document.querySelector('.btn-secondary').addEventListener('click', () => {
    // Chrome 不允许直接打开 chrome:// URLs，所以显示提示
    showMessage('请在浏览器地址栏输入: chrome://extensions/shortcuts', 'info');
  });
});

// 保存设置到 Chrome 存储
async function saveSettings() {
  const webhookUrl = document.getElementById('webhookUrl').value.trim();
  const defaultTag = document.getElementById('defaultTag').value.trim();

  // 验证 webhook URL
  if (!webhookUrl) {
    showMessage('请输入 Webhook URL', 'error');
    return;
  }

  // 确保标签以 # 开头
  const formattedTag = defaultTag.startsWith('#') ? defaultTag : `#${defaultTag}`;

  try {
    await chrome.storage.sync.set({
      webhookUrl: webhookUrl,
      defaultTag: formattedTag
    });
    
    showMessage('设置已保存', 'success');
  } catch (error) {
    console.error('保存设置失败:', error);
    showMessage('保存失败，请重试', 'error');
  }
}

// 从 Chrome 存储加载设置
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get(['webhookUrl', 'defaultTag']);
    
    // 填充表单
    document.getElementById('webhookUrl').value = settings.webhookUrl || '';
    document.getElementById('defaultTag').value = settings.defaultTag || '#Chrome阅读笔记';
  } catch (error) {
    console.error('加载设置失败:', error);
    showMessage('加载设置失败', 'error');
  }
}

// 显示消息提示
function showMessage(message, type = 'info') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = message;
  
  // 移除可能存在的旧消息
  const oldMessage = document.querySelector('.message');
  if (oldMessage) {
    oldMessage.remove();
  }
  
  document.body.appendChild(messageDiv);
  
  // 3秒后自动消失
  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
} 