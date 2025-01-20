// 创建面板
function createPanel() {
  const panel = document.createElement('div');
  panel.id = 'flomo-panel';
  panel.innerHTML = `
    <div class="container">
      <div class="header">
        <h1>Flomo Quick Save</h1>
        <span class="close-btn">×</span>
      </div>
      <!-- 在这里添加其他面板内容 -->
    </div>
  `;
  document.body.appendChild(panel);
}

// 切换面板显示状态
function togglePanel() {
  const panel = document.getElementById('flomo-panel');
  if (panel) {
    panel.classList.toggle('show');
    document.body.classList.toggle('flomo-panel-open');
  }
}

// 初始化面板
function initializePanel() {
  // 确保面板只被创建一次
  if (!document.getElementById('flomo-panel')) {
    createPanel();
  }
  
  // 添加关闭按钮事件监听
  document.querySelector('.close-btn')?.addEventListener('click', () => {
    togglePanel();
  });
}

// 监听来自 background.js 的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'togglePanel') {
    // 确保面板已初始化
    if (!document.getElementById('flomo-panel')) {
      initializePanel();
    }
    togglePanel();
    // 发送响应
    sendResponse({success: true});
  }
  // 必须返回 true 以支持异步响应
  return true;
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initializePanel); 