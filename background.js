// 监听扩展图标点击
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // 使用 scripting API 向当前标签页注入代码
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: togglePanel
    });
  } catch (error) {
    console.error('Error:', error);
  }
});

// 切换面板显示的函数
function togglePanel() {
  const panel = document.getElementById('flomo-panel');
  if (panel) {
    panel.classList.toggle('show');
    if (panel.classList.contains('show')) {
      document.getElementById('titleAndLink').value = `${document.title}\n${window.location.href}`;
    }
  }
}