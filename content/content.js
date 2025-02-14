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

// 修改初始化时机，确保在 DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
  initializeFloatingButtons();
});

// 直接初始化，以防 DOMContentLoaded 已经触发
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFloatingButtons);
} else {
  initializeFloatingButtons();
}

// 检查是否应该显示按钮
async function shouldShowButtons() {
  try {
    // 首先检查扩展上下文是否有效
    if (!chrome?.runtime?.id) {
      return false;
    }

    // 检查 chrome.storage 是否可用
    if (!chrome?.storage?.sync) {
      // console.warn('chrome.storage.sync 不可用，默认显示按钮');
      return true;
    }
    
    const settings = await chrome.storage.sync.get(['globalDisabled', 'disabledSites']);
    if (settings.globalDisabled) return false;
    
    const hostname = window.location.hostname;
    const disabledSites = settings.disabledSites || [];
    return !disabledSites.includes(hostname);
  } catch (error) {
    // 更详细的错误处理
    if (error.message.includes('Extension context invalidated')) {
      return false;
    }
    console.warn('检查按钮显示状态失败:', error);
    return false; // 出错时默认不显示按钮，避免影响用户体验
  }
}

// 检查扩展上下文是否有效
function isExtensionValid() {
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
}

// 检查插件是否打开
async function isPopupOpen() {
  if (!isExtensionValid()) {
    return false;
  }

  try {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'checkPopupState' }, response => {
        if (chrome.runtime.lastError) {
          console.warn('检查插件状态失败:', chrome.runtime.lastError);
          resolve(false);
          return;
        }
        resolve(response?.isOpen || false);
      });
    });
  } catch (error) {
    console.warn('检查插件状态失败:', error);
    return false;
  }
}

// 修改填充按钮状态更新函数
async function updateFillButtonState() {
  if (!isExtensionValid()) {
    return;
  }

  const fillBtn = document.querySelector('.fill-btn');
  if (fillBtn) {
    try {
      const isOpen = await isPopupOpen();
      if (!isExtensionValid()) {
        return;
      }
      
      // 移除禁用状态，只更新提示文本
      fillBtn.disabled = false;
      fillBtn.setAttribute('title', isOpen ? '填充到插件' : '请先打开插件');
      fillBtn.style.opacity = '1';
      fillBtn.style.cursor = 'pointer';
      
      // 存储插件状态，用于点击时判断
      fillBtn.dataset.isPluginOpen = isOpen;
    } catch (error) {
      console.warn('更新按钮状态失败:', error);
      if (fillBtn) {
        fillBtn.disabled = false;
        fillBtn.setAttribute('title', '插件状态检查失败');
      }
    }
  }
}

// 添加一个变量来追踪浮动插件页面的状态
let floatingPanel = null;

// 修改初始化函数
function initializeFloatingButtons() {
  // 确保按钮只被创建一次
  if (document.querySelector('.floating-buttons')) {
    console.log('浮动按钮已存在，跳过初始化');
    return;
  }

  console.log('初始化浮动按钮功能');

  const floatingButtons = document.createElement('div');
  floatingButtons.className = 'floating-buttons';
  
  const iconUrl = chrome.runtime.getURL('icons/icon16.png');
  floatingButtons.innerHTML = `
    <div class="buttons-group">
      <div class="plugin-icon">
        <img src="${iconUrl}" alt="SnapFlomo">
      </div>
      <button class="action-btn copy-btn">
        <span class="icon">📋</span>
        <span class="text">复制</span>
      </button>
      <button class="action-btn fill-btn" disabled title="请先打开插件">
        <span class="icon">📝</span>
        <span class="text">填充</span>
      </button>
      <div class="buttons-divider"></div>
      <button class="settings-btn" title="设置">
        <span class="dots">⋮</span>
      </button>
      <button class="close-btn" title="关闭">
        <span class="close">×</span>
      </button>
    </div>
    <div class="settings-menu">
      <div class="menu-item disable-site">
        <span class="icon">🚫</span>
        <span class="text">在此网站停用</span>
      </div>
      <div class="menu-item disable-all">
        <span class="icon">⭕</span>
        <span class="text">在所有网站停用</span>
      </div>
    </div>
  `;
  
  document.body.appendChild(floatingButtons);
  console.log('浮动按钮已添加到页面');

  // 添加复制按钮事件
  floatingButtons.querySelector('.copy-btn').addEventListener('click', async () => {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      try {
        await navigator.clipboard.writeText(selectedText);
        console.log('文本已复制到剪贴板');
        // 可以添加一个复制成功的提示
        showToast('复制成功');
      } catch (err) {
        console.error('复制失败:', err);
        showToast('复制失败');
      }
    }
  });

  // 修改填充按钮事件处理逻辑
  floatingButtons.querySelector('.fill-btn').addEventListener('click', async () => {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      // 点击时实时检查插件状态
      const isOpen = await isPopupOpen();
      
      if (!isOpen) {
        showToast('请先打开插件');
        return;
      }

      // 插件已打开，执行填充操作
      chrome.runtime.sendMessage({
        action: 'fillSelectedText',
        text: selectedText,
        append: true
      }, (response) => {
        if (response && response.success) {
          showToast('内容已追加');
        } else {
          showToast('填充失败，请重试');
        }
      });
    }
  });

  // 修改设置按钮事件
  floatingButtons.querySelector('.settings-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    
    const settingsMenu = floatingButtons.querySelector('.settings-menu');
    if (settingsMenu) {
      settingsMenu.style.display = settingsMenu.style.display === 'block' ? 'none' : 'block';
    }
  });

  // 点击其他地方关闭菜单
  document.addEventListener('click', (e) => {
    const settingsMenu = document.querySelector('.settings-menu');
    const settingsBtn = document.querySelector('.settings-btn');
    if (settingsMenu && !settingsMenu.contains(e.target) && !settingsBtn.contains(e.target)) {
      settingsMenu.style.display = 'none';
    }
  });

  // 修改菜单项点击事件
  floatingButtons.querySelector('.disable-site').addEventListener('click', async () => {
    const hostname = window.location.hostname;
    const settings = await chrome.storage.sync.get(['disabledSites']);
    const disabledSites = settings.disabledSites || [];
    
    if (!disabledSites.includes(hostname)) {
      disabledSites.push(hostname);
      await chrome.storage.sync.set({ disabledSites });
      showToast('已禁用当前网站');
    }
    floatingButtons.querySelector('.settings-menu').style.display = 'none';
  });

  floatingButtons.querySelector('.disable-all').addEventListener('click', async () => {
    await chrome.storage.sync.set({ globalDisabled: true });
    showToast('已在所有网站停用');
    floatingButtons.querySelector('.settings-menu').style.display = 'none';
  });

  // 修改关闭按钮事件处理
  floatingButtons.querySelector('.close-btn').addEventListener('click', () => {
    const floatingButtons = document.querySelector('.floating-buttons');
    if (floatingButtons) {
      floatingButtons.style.display = 'none';
      // 清除选中的文本
      window.getSelection().removeAllRanges();
    }
  });

  // 添加现有的鼠标和键盘事件监听
  document.addEventListener('mouseup', (e) => {
    console.log('触发 mouseup 事件');
    handleTextSelection(e);
  });

  document.addEventListener('keyup', (e) => {
    if (e.key === 'Shift' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      console.log('触发键盘选择事件');
      handleTextSelection(e);
    }
  });

  // 初始化时更新一次按钮状态
  updateFillButtonState();

  // 使用 MutationObserver 监听 DOM 变化
  const observer = new MutationObserver((mutations) => {
    const fillBtn = document.querySelector('.fill-btn');
    if (fillBtn && isExtensionValid()) {
      updateFillButtonState();
    }
  });

  // 在初始化 observer 之前检查
  if (isExtensionValid()) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // 监听扩展消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'popupStateChanged') {
      updateFillButtonState();
    }
    return true;
  });

  // 替换 unload 事件监听
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      observer.disconnect();
    }
  });

  return floatingButtons;
}

// 修改文本选择处理函数
async function handleTextSelection(e) {
  try {
    if (!isExtensionValid()) {
      return;
    }

    const shouldShow = await shouldShowButtons();
    if (!shouldShow) {
      return;
    }
    
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    const floatingButtons = document.querySelector('.floating-buttons');
    
    if (!selectedText) {
      if (floatingButtons) {
        floatingButtons.style.display = 'none';
      }
      return;
    }

    // 在初始化或操作 DOM 之前再次检查扩展上下文
    if (!isExtensionValid()) {
      return;
    }

    if (!floatingButtons) {
      initializeFloatingButtons();
      return;
    }

    // 获取选区范围和位置
    const range = selection.getRangeAt(0);
    const rects = range.getClientRects();
    const lastRect = rects[rects.length - 1];
    
    if (!lastRect) {
      return;
    }

    // 计算绝对位置（考虑滚动位置）
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    // 使用 position: absolute 而不是 fixed
    floatingButtons.style.position = 'absolute';
    floatingButtons.style.display = 'block';
    floatingButtons.style.left = `${lastRect.right + scrollX}px`;
    floatingButtons.style.top = `${lastRect.top + scrollY - 32}px`;

    const buttonsRect = floatingButtons.getBoundingClientRect();
    if (buttonsRect.top < scrollY) {
      floatingButtons.style.top = `${lastRect.bottom + scrollY + 8}px`;
      floatingButtons.classList.add('below');
    } else {
      floatingButtons.classList.remove('below');
    }

  } catch (error) {
    // 静默处理错误，不显示任何提示
    return;
  }
}

// 修改提示框函数,使其显示在悬浮按钮附近
function showToast(message) {
  try {
    if (!isExtensionValid()) {
      return;
    }
    
    const toast = document.createElement('div');
    toast.className = 'flomo-toast';
    toast.textContent = message;
    
    const floatingButtons = document.querySelector('.floating-buttons');
    if (floatingButtons) {
      const rect = floatingButtons.getBoundingClientRect();
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      
      toast.style.position = 'absolute';
      toast.style.bottom = 'auto';
      toast.style.left = `${rect.left}px`;
      toast.style.top = `${rect.top + scrollY - 40}px`;
      toast.style.transform = 'translateX(0)';
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast && toast.parentNode) {
        toast.remove();
      }
    }, 2000);
  } catch (error) {
    // 静默处理错误，不显示任何提示
    return;
  }
} 
