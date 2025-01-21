// 监听扩展图标点击
chrome.action.onClicked.addListener(async (tab) => {
  // 打开侧边栏
  await chrome.sidePanel.open({ windowId: tab.windowId });
});

// 确保侧边栏保持打开状态
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

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