// 存储每个标签页的历史
let tabHistories = {};

// 初始化：加载已保存的历史
chrome.storage.local.get(['tabHistories'], (result) => {
  if (result.tabHistories) {
    tabHistories = result.tabHistories;
  }
});

// 监听标签页激活（用户切换标签页）
chrome.tabs.onActivated.addListener((activeInfo) => {
  const { tabId, windowId } = activeInfo;
  
  // 获取标签页详情
  chrome.tabs.get(tabId, (tab) => {
    if (tab && tab.url && !tab.url.startsWith('chrome://')) {
      recordTabVisit(tabId, tab);
    }
  });
});

// 监听标签页更新（页面导航）
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 当页面加载完成且URL变化时记录
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    recordTabVisit(tabId, tab);
  }
});

// 记录标签页访问
function recordTabVisit(tabId, tab) {
  if (!tabHistories[tabId]) {
    tabHistories[tabId] = {
      backStack: [],
      forwardStack: [],
      currentEntry: null
    };
  }
  
  const history = tabHistories[tabId];
  const newEntry = {
    tabId: tabId,
    windowId: tab.windowId,
    url: tab.url,
    title: tab.title || tab.url,
    timestamp: Date.now()
  };
  
  // 如果当前有记录，把当前记录压入后退栈
  if (history.currentEntry) {
    // 避免重复记录相同的URL
    if (history.currentEntry.url !== newEntry.url) {
      history.backStack.push(history.currentEntry);
      // 限制后退栈大小（比如50条）
      if (history.backStack.length > 50) {
        history.backStack.shift();
      }
      // 新导航时清空前栈
      history.forwardStack = [];
    }
  }
  
  history.currentEntry = newEntry;
  
  // 保存到storage
  saveHistories();
}

// 后退功能
function navigateBack() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (!currentTab) return;
    
    const tabId = currentTab.id;
    const history = tabHistories[tabId];
    
    if (history && history.backStack.length > 0) {
      // 当前记录压入前栈
      if (history.currentEntry) {
        history.forwardStack.push(history.currentEntry);
      }
      
      // 取出后退栈最后一条
      const previousEntry = history.backStack.pop();
      history.currentEntry = previousEntry;
      
      // 导航到历史记录
      chrome.tabs.update(tabId, { url: previousEntry.url });
      saveHistories();
    } else {
      // 没有后退历史，可以提示用户
      console.log('没有后退历史');
    }
  });
}

// 前进功能
function navigateForward() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (!currentTab) return;
    
    const tabId = currentTab.id;
    const history = tabHistories[tabId];
    
    if (history && history.forwardStack.length > 0) {
      // 当前记录压入后退栈
      if (history.currentEntry) {
        history.backStack.push(history.currentEntry);
      }
      
      // 取出前栈最后一条
      const nextEntry = history.forwardStack.pop();
      history.currentEntry = nextEntry;
      
      // 导航到历史记录
      chrome.tabs.update(tabId, { url: nextEntry.url });
      saveHistories();
    } else {
      console.log('没有前进历史');
    }
  });
}

// 保存历史到storage
function saveHistories() {
  chrome.storage.local.set({ tabHistories });
}

// 监听快捷键命令
chrome.commands.onCommand.addListener((command) => {
  if (command === 'navigate-back') {
    navigateBack();
  } else if (command === 'navigate-forward') {
    navigateForward();
  }
});

// 标签页关闭时清理历史
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabHistories[tabId]) {
    delete tabHistories[tabId];
    saveHistories();
  }
});

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'navigateBack') {
    navigateBack();
  } else if (request.action === 'navigateForward') {
    navigateForward();
  }
  return true;
});

// 增强的导航函数，支持异步操作
async function navigateBack() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];
  if (!currentTab) return;
  
  const history = tabHistories[currentTab.id];
  if (history && history.backStack.length > 0) {
    // 保存当前位置到前进栈
    if (history.currentEntry) {
      history.forwardStack.push(history.currentEntry);
    }
    
    // 从后退栈取出
    const targetEntry = history.backStack.pop();
    history.currentEntry = targetEntry;
    
    // 更新标签页并发送通知
    await chrome.tabs.update(currentTab.id, { url: targetEntry.url });
    saveHistories();
    
    // 通知 popup 更新（如果打开）
    chrome.runtime.sendMessage({ action: 'historyUpdated' });
  }
}

// 添加标签页组支持（Chrome 标签页分组）
async function groupTabsByDomain() {
  const tabs = await chrome.tabs.query({});
  const groups = {};
  
  tabs.forEach(tab => {
    try {
      const domain = new URL(tab.url).hostname;
      if (!groups[domain]) {
        groups[domain] = [];
      }
      groups[domain].push(tab.id);
    } catch (e) {
      // 忽略无效URL
    }
  });
  
  // 为每个域名创建分组
  for (const [domain, tabIds] of Object.entries(groups)) {
    if (tabIds.length > 1) {
      const groupId = await chrome.tabs.group({ tabIds });
      await chrome.tabGroups.update(groupId, { title: domain });
    }
  }
}