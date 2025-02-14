class StatisticsManager {
  constructor() {
    this.currentDate = new Date();
    this.charts = {};
    this.initializeUI();
    this.loadStatistics();
  }

  async initializeUI() {
    // 初始化日期选择器
    this.updateDateDisplay();
    document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));
    
    // 初始化图表
    this.initializeCharts();
  }

  updateDateDisplay() {
    const monthStr = this.currentDate.toLocaleString('zh-CN', { year: 'numeric', month: 'long' });
    document.getElementById('currentMonth').textContent = monthStr;
  }

  changeMonth(delta) {
    this.currentDate.setMonth(this.currentDate.getMonth() + delta);
    this.updateDateDisplay();
    this.loadStatistics();
  }

  initializeCharts() {
    // 初始化分类统计图表
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    this.charts.category = new Chart(categoryCtx, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [
            '#1890ff',
            '#52c41a',
            '#faad14',
            '#f5222d',
            '#722ed1',
            '#13c2c2'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,  // 保持环形图的宽高比
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });

    // 优化趋势图表
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    this.charts.trend = new Chart(trendCtx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: '笔记数量',
          data: [],
          backgroundColor: '#1890ff',
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,  // 允许图表填充容器
        layout: {
          padding: {
            top: 20,
            bottom: 20
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              precision: 0
            },
            suggestedMax: 5,
            grid: {
              drawBorder: false
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `数量: ${context.parsed.y}`;
              }
            }
          }
        }
      }
    });
  }

  async loadStatistics() {
    const monthKey = this.getMonthKey(this.currentDate);
    const { saveStats = {} } = await chrome.storage.local.get('saveStats');
    
    const currentMonthData = saveStats[monthKey] || { 
      count: 0, 
      categories: {}, 
      recentSaves: [] 
    };
    
    // 更新统计卡片
    this.updateStatCards(currentMonthData, saveStats);
    
    // 更新图表
    this.updateCharts(currentMonthData);
    
    // 更新历史列表
    this.updateHistoryList(currentMonthData.recentSaves);
  }

  updateStatCards(currentMonthData, allHistory) {
    // 更新本月统计
    const monthCount = currentMonthData.count || 0;
    document.getElementById('monthCount').textContent = monthCount;
    
    // 计算环比增长
    const lastMonth = this.getLastMonthData(allHistory);
    const growth = this.calculateGrowth(monthCount, lastMonth?.count || 0);
    
    const trendElement = document.getElementById('monthTrend');
    if (growth !== null) {
      const trendIcon = growth >= 0 ? '↑' : '↓';
      const trendClass = growth >= 0 ? 'trend-up' : 'trend-down';
      trendElement.innerHTML = `
        <span class="trend-icon ${trendClass}">${trendIcon}</span>
        <span class="trend-value ${trendClass}">${Math.abs(growth)}%</span>
      `;
    } else {
      trendElement.innerHTML = '<span class="trend-value">-</span>';
    }
    
    // 计算累计总数
    const totalCount = Object.values(allHistory).reduce((sum, month) => sum + (month.count || 0), 0);
    document.getElementById('totalCount').textContent = totalCount || 0;
    
    // 计算平均字数
    const avgWords = this.calculateAverageWords(currentMonthData);
    document.getElementById('avgWords').textContent = avgWords || 0;
  }

  // 获取上月数据
  getLastMonthData(allHistory) {
    const lastMonth = new Date(this.currentDate);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthKey = this.getMonthKey(lastMonth);
    return allHistory[lastMonthKey];
  }

  // 计算环比增长率
  calculateGrowth(current, last) {
    if (last === 0) return null;
    return Math.round((current - last) / last * 100);
  }

  // 计算平均字数
  calculateAverageWords(monthData) {
    if (!monthData.count || monthData.count === 0) return 0;
    const totalWords = monthData.recentSaves.reduce((sum, item) => sum + (item.wordCount || 0), 0);
    return Math.round(totalWords / monthData.count);
  }

  // 当没有数据时显示提示
  showNoDataMessage(container) {
    container.innerHTML = `
      <div class="no-data">
        <div class="no-data-icon">📊</div>
        <div class="no-data-text">暂无数据，快去保存一些内容吧～</div>
      </div>
    `;
  }

  updateCharts(currentMonthData) {
    // 更新分类统计图表
    const categoryData = {
      labels: Object.keys(currentMonthData.categories),
      datasets: [{
        data: Object.values(currentMonthData.categories),
        backgroundColor: [
          '#1890ff',
          '#52c41a',
          '#faad14',
          '#f5222d',
          '#722ed1',
          '#13c2c2'
        ]
      }]
    };
    this.charts.category.data.labels = categoryData.labels;
    this.charts.category.data.datasets[0].data = categoryData.datasets[0].data;
    this.charts.category.update();

    // 更新趋势图表
    const categories = currentMonthData.categories || {};
    const labels = Object.keys(categories);
    const data = Object.values(categories);
    let maxCount = Math.max(...data, 0);  // 确保至少为0

    // 更新图表数据
    this.charts.trend.data.labels = labels;
    this.charts.trend.data.datasets[0].data = data;

    // 动态调整Y轴最大值
    const suggestedMax = maxCount > 0 ? maxCount + 1 : 5;
    this.charts.trend.options.scales.y.suggestedMax = suggestedMax;

    this.charts.trend.update();
  }

  updateHistoryList(items) {
    const recentList = document.getElementById('recentList');
    recentList.innerHTML = '';

    items.forEach(item => {
      const historyItem = this.createHistoryItem(item);
      recentList.appendChild(historyItem);
    });
  }

  createHistoryItem(item) {
    const div = document.createElement('div');
    div.className = 'history-item';
    
    // 格式化时间
    const formattedDate = new Date(item.timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/\//g, '-');
    
    div.innerHTML = `
      <span class="col-title" title="${item.title}">
        ${item.url ? 
          `<a href="${item.url}" target="_blank">${item.title}</a>` :
          item.title
        }
      </span>
      <span class="col-tag">${item.tag || '-'}</span>
      <span class="col-words">${item.wordCount || 0}</span>
      <span class="col-time">${formattedDate}</span>
    `;
    
    return div;
  }

  formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  getMonthKey(date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}`;
  }
}

// 初始化统计管理器
document.addEventListener('DOMContentLoaded', () => {
  new StatisticsManager();
}); 