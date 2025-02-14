// 全局状态管理
let isPopupOpen = false;
let port = null; // 添加一个持久连接的端口

// 统一的消息处理函数
async function handleMessage(request, sender, sendResponse) {
  switch (request.action) {
    case 'checkPopupState':
      sendResponse({ isOpen: isPopupOpen });
      break;
      
    case 'popupOpened':
      isPopupOpen = true;
      try {
        // 获取当前标签页信息
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        // 使用端口发送消息而不是 runtime.sendMessage
        if (port) {
          port.postMessage({
            action: 'resetContent',
            data: {
              title: tab.title,
              url: tab.url
            }
          });
        }
        
        // 通知所有content script更新状态
        const tabs = await chrome.tabs.query({});
        await Promise.all(tabs.map(tab => 
          chrome.tabs.sendMessage(tab.id, { 
            action: 'popupStateChanged', 
            isOpen: true 
          }).catch(() => {})
        ));
      } catch (error) {
        console.error('Error handling popup opened:', error);
      }
      break;
      
    case 'popupClosed':
      isPopupOpen = false;
      try {
        // 通知所有content script更新状态
        const tabs = await chrome.tabs.query({});
        await Promise.all(tabs.map(tab => 
          chrome.tabs.sendMessage(tab.id, { 
            action: 'popupStateChanged', 
            isOpen: false 
          }).catch(() => {})
        ));
      } catch (error) {
        console.error('Error notifying tabs:', error);
      }
      break;
  }
}

// 统一的消息监听器
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return false; // 不使用异步响应
});

// 监听扩展图标点击
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // 打开侧边栏
    await chrome.sidePanel.open({ windowId: tab.windowId });
    // 通知内容脚本
    await chrome.tabs.sendMessage(tab.id, { action: 'popupOpened' });
  } catch (error) {
    console.error('Error opening side panel:', error);
  }
});

// 设置侧边栏行为
chrome.sidePanel.setPanelBehavior({ 
  openPanelOnActionClick: true 
}).catch(error => {
  console.error('Error setting panel behavior:', error);
});

// 监听连接
chrome.runtime.onConnect.addListener(newPort => {
  if (newPort.name === 'popup') {
    port = newPort; // 保存连接的端口
    isPopupOpen = true;
    
    // 处理连接断开
    port.onDisconnect.addListener(() => {
      port = null;
      isPopupOpen = false;
      // 通知所有content script更新状态
      chrome.tabs.query({}).then(tabs => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { 
            action: 'popupStateChanged', 
            isOpen: false 
          }).catch(() => {});
        });
      });
    });
  }
});

// 监听标签页切换
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    if (isPopupOpen && port) {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      // 使用端口发送消息
      port.postMessage({
        action: 'resetContent',
        data: {
          title: tab.title,
          url: tab.url
        }
      });
    }
  } catch (error) {
    console.error('Error handling tab activation:', error);
  }
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  try {
    if (changeInfo.status === 'complete' && isPopupOpen && port) {
      // 使用端口发送消息
      port.postMessage({
        action: 'resetContent',
        data: {
          title: tab.title,
          url: tab.url
        }
      });
    }
  } catch (error) {
    console.error('Error handling tab update:', error);
  }
});