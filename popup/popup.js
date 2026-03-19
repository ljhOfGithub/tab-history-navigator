// popup.js - 完整功能版本
document.addEventListener('DOMContentLoaded', () => {
  loadHistory();
  initializeEventListeners();
  initializeContextMenu();
});

let currentHistoryData = null;
let contextMenuTarget = null;

// 初始化事件监听
function initializeEventListeners() {
  document.getElementById('back-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'navigateBack' });
    window.close();
  });
  
  document.getElementById('forward-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'navigateForward' });
    window.close();
  });
  
  document.getElementById('clear-btn').addEventListener('click', clearHistory);
  
  // 点击外部关闭右键菜单
  document.addEventListener('click', () => {
    document.getElementById('context-menu').classList.remove('show');
  });
}

// 初始化右键菜单
function initializeContextMenu() {
  const menu = document.getElementById('context-menu');
  
  document.getElementById('menu-open-newtab').addEventListener('click', () => {
    if (contextMenuTarget) {
      openInNewTab(contextMenuTarget.url);
    }
  });
  
  document.getElementById('menu-copy-url').addEventListener('click', () => {
    if (contextMenuTarget) {
      copyToClipboard(contextMenuTarget.url);
      showToast('完整URL已复制到剪贴板');
    }
  });
  
  document.getElementById('menu-copy-title').addEventListener('click', () => {
    if (contextMenuTarget) {
      copyToClipboard(contextMenuTarget.title);
      showToast('标题已复制到剪贴板');
    }
  });
  
  document.getElementById('menu-remove').addEventListener('click', () => {
    if (contextMenuTarget) {
      removeHistoryItem(contextMenuTarget);
    }
  });
}

// 加载历史记录
async function loadHistory() {
  const container = document.getElementById('history-list');
  container.innerHTML = '<div class="loading">加载历史记录中...</div>';
  
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const currentTab = tabs[0];
    if (!currentTab) return;
    
    chrome.storage.local.get(['tabHistories'], (result) => {
      const histories = result.tabHistories || {};
      currentHistoryData = histories[currentTab.id];
      
      if (currentHistoryData && (
          (currentHistoryData.backStack && currentHistoryData.backStack.length > 0) || 
          currentHistoryData.currentEntry || 
          (currentHistoryData.forwardStack && currentHistoryData.forwardStack.length > 0))) {
        displayHistory(currentHistoryData);
      } else {
        showEmptyState(container);
      }
    });
  });
}

// 显示空状态
function showEmptyState(container) {
  container.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <p>暂无历史记录</p>
      <small>切换标签页或导航新页面后开始记录</small>
    </div>
  `;
}

// 显示历史记录
function displayHistory(history) {
  const container = document.getElementById('history-list');
  container.innerHTML = '';
  
  // 后退历史（从旧到新显示）
  if (history.backStack && history.backStack.length > 0) {
    addSectionHeader(container, '← 后退历史', history.backStack.length);
    // 反转显示，让最近的在上面
    [...history.backStack].reverse().forEach((entry, index) => {
      addHistoryItem(container, entry, 'back', index);
    });
  }
  
  // 当前页面
  if (history.currentEntry) {
    addSectionHeader(container, '● 当前页面', 1);
    addHistoryItem(container, history.currentEntry, 'current');
  }
  
  // 前进历史
  if (history.forwardStack && history.forwardStack.length > 0) {
    addSectionHeader(container, '→ 前进历史', history.forwardStack.length);
    history.forwardStack.forEach((entry, index) => {
      addHistoryItem(container, entry, 'forward', index);
    });
  }
}

// 添加分组标题
function addSectionHeader(container, title, count) {
  const header = document.createElement('div');
  header.className = 'section-title';
  header.textContent = `${title} (${count})`;
  container.appendChild(header);
}

// 添加历史条目
function addHistoryItem(container, entry, type) {
  const item = document.createElement('div');
  item.className = `history-item ${type}`;
  item.dataset.url = entry.url;
  item.dataset.title = entry.title;
  item.dataset.tabId = entry.tabId;
  
  // 提取域名用于显示
  let domain = '';
  try {
    domain = new URL(entry.url).hostname;
  } catch (e) {
    domain = '未知域名';
  }
  
  // 截取显示用的URL（但保留完整URL用于复制）
  const displayUrl = entry.url.length > 60 ? entry.url.substring(0, 57) + '...' : entry.url;
  
  item.innerHTML = `
    <div class="item-title" title="${escapeHtml(entry.title)}">${escapeHtml(entry.title) || '无标题'}</div>
    <div class="item-url" title="${escapeHtml(entry.url)}">
      <span class="domain-badge">${escapeHtml(domain)}</span>
      ${escapeHtml(displayUrl)}
    </div>
    <div class="item-actions">
      <button class="action-btn" title="在新标签页打开 (Ctrl+点击)" data-action="newtab">
        <svg viewBox="0 0 24 24">
          <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
        </svg>
      </button>
      <button class="action-btn" title="复制完整URL" data-action="copy">
        <svg viewBox="0 0 24 24">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
      </button>
    </div>
  `;
  
  // 普通点击 - 在当前标签页打开
  item.addEventListener('click', (e) => {
    // 如果不是点击操作按钮
    if (!e.target.closest('.action-btn')) {
      handleItemClick(entry, e);
    }
  });
  
  // 右键菜单
  item.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    contextMenuTarget = entry;
    showContextMenu(e.pageX, e.pageY);
  });
  
  // 操作按钮事件
  const newTabBtn = item.querySelector('[data-action="newtab"]');
  newTabBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openInNewTab(entry.url);
  });
  
  const copyBtn = item.querySelector('[data-action="copy"]');
  copyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    copyToClipboard(entry.url);
    showToast('完整URL已复制到剪贴板');
  });
  
  container.appendChild(item);
}

// HTML转义（防止XSS）
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 处理条目点击
function handleItemClick(entry, event) {
  // Command (Mac) 或 Ctrl (Windows) 点击在新标签页打开
  if (event.metaKey || event.ctrlKey) {
    openInNewTab(entry.url);
  } else {
    // 普通点击在当前标签页打开
    chrome.tabs.update(entry.tabId, { url: entry.url });
    window.close();
  }
}

// 在新标签页打开（后台打开，不激活）
function openInNewTab(url) {
  chrome.tabs.create({ url, active: false });
  showToast('已在新标签页打开');
}

// 复制到剪贴板
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(err => {
    console.error('复制失败:', err);
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  });
}

// 显示右键菜单
function showContextMenu(x, y) {
  const menu = document.getElementById('context-menu');
  
  // 确保菜单不超出窗口
  const menuWidth = 180;
  const windowWidth = window.innerWidth;
  
  let left = x;
  if (left + menuWidth > windowWidth) {
    left = windowWidth - menuWidth - 5;
  }
  
  menu.style.left = `${left}px`;
  menu.style.top = `${y}px`;
  menu.classList.add('show');
}

// 移除历史条目
function removeHistoryItem(entry) {
  chrome.storage.local.get(['tabHistories'], (result) => {
    const histories = result.tabHistories || {};
    const tabHistory = histories[entry.tabId];
    
    if (tabHistory) {
      // 从所有栈中移除该条目（基于完整URL匹配）
      tabHistory.backStack = tabHistory.backStack.filter(item => item.url !== entry.url);
      tabHistory.forwardStack = tabHistory.forwardStack.filter(item => item.url !== entry.url);
      
      // 如果是当前页面，不清空，只移除历史中的重复项
      
      chrome.storage.local.set({ tabHistories: histories }, () => {
        loadHistory(); // 刷新显示
        showToast('已从历史中移除');
      });
    }
  });
}

// 清空历史
function clearHistory() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    
    chrome.storage.local.get(['tabHistories'], (result) => {
      const histories = result.tabHistories || {};
      if (histories[tabId]) {
        // 保留当前页面，只清空后退和前进栈
        histories[tabId] = {
          backStack: [],
          forwardStack: [],
          currentEntry: histories[tabId].currentEntry
        };
        
        chrome.storage.local.set({ tabHistories: histories }, () => {
          loadHistory();
          showToast('历史记录已清空');
        });
      }
    });
  });
}

// 格式化时间
function formatTime(timestamp) {
  if (!timestamp) return '刚刚';
  
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  
  return new Date(timestamp).toLocaleDateString();
}

// 显示提示
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// 监听来自background的消息
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'historyUpdated') {
    loadHistory();
  }
});