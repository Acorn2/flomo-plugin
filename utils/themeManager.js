class ThemeManager {
  constructor() {
    this.themes = {
      default: {
        name: '默认主题',
        icon: '🎨',
      },
      christmas: {
        name: '圣诞主题',
        icon: '🎄',
      },
      newyear: {
        name: '新年主题',
        icon: '🎊',
      },
      snake: {
        name: '蛇年主题',
        icon: '🐍',
      }
    };
  }

  async init() {
    const { theme } = await chrome.storage.sync.get('theme');
    this.applyTheme(theme || 'default');
  }

  async applyTheme(themeName) {
    // 移除所有主题相关的 data-theme 属性
    document.documentElement.removeAttribute('data-theme');
    
    // 如果选择的不是默认主题，则添加对应的 data-theme
    if (themeName !== 'default') {
      document.documentElement.setAttribute('data-theme', themeName);
    }
    
    // 保存主题设置到 storage，不使用 runtime.sendMessage
    await chrome.storage.sync.set({ theme: themeName });
    
    // 更新主题卡片的激活状态
    this.updateActiveThemeCard(themeName);
  }

  updateActiveThemeCard(themeName) {
    // 移除所有主题卡片的激活状态
    document.querySelectorAll('.theme-card').forEach(card => {
      card.classList.remove('active');
    });
    
    // 添加当前主题卡片的激活状态
    const activeCard = document.querySelector(`.theme-card[data-theme="${themeName}"]`);
    if (activeCard) {
      activeCard.classList.add('active');
    }
  }
}

export default ThemeManager; 