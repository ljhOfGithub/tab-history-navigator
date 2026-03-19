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
    if (tab && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://') && !tab.url.startsWith('about:')) {
      recordTabVisit(tabId, tab);
    }
  });
});

// 监听标签页更新（页面导航）- 关键：确保记录完整URL
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 当页面加载完成且URL变化时记录
  // 使用status='complete'确保获取到最终URL（包括SPA路由变化）
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://') && !tab.url.startsWith('about:')) {
    recordTabVisit(tabId, tab);
  }
  
  // 额外监听url变化，确保SPA应用也能记录（有些SPA不触发complete）
  if (changeInfo.url) {
    // 延迟一下确保获取完整信息
    setTimeout(() => {
      chrome.tabs.get(tabId, (updatedTab) => {
        if (updatedTab && updatedTab.url && !updatedTab.url.startsWith('chrome://')) {
          recordTabVisit(tabId, updatedTab);
        }
      });
    }, 100);
  }
});

// 记录标签页访问 - 保存完整URL
function recordTabVisit(tabId, tab) {
  if (!tabHistories[tabId]) {
    tabHistories[tabId] = {
      backStack: [],
      forwardStack: [],
      currentEntry: null
    };
  }
  
  const history = tabHistories[tabId];
  
  // 使用tab.url，这是浏览器提供的完整URL（包括所有参数和#片段）
  const fullUrl = tab.url;
  const pageTitle = tab.title || fullUrl;
  
  const newEntry = {
    tabId: tabId,
    windowId: tab.windowId,
    url: fullUrl,           // 完整URL，一字不差
    title: pageTitle,
    timestamp: Date.now()
  };
  
  // 如果当前有记录，把当前记录压入后退栈
  if (history.currentEntry) {
    // 避免重复记录完全相同的URL（包括所有参数）
    if (history.currentEntry.url !== newEntry.url) {
      history.backStack.push(history.currentEntry);
      // 限制后退栈大小（比如50条）
      if (history.backStack.length > 50) {
        history.backStack.shift();
      }
      // 新导航时清空前栈
      history.forwardStack = [];
    } else {
      // 如果是同一个URL，只更新时间戳
      history.currentEntry.timestamp = newEntry.timestamp;
      saveHistories();
      return;
    }
  }
  
  history.currentEntry = newEntry;
  
  // 保存到storage
  saveHistories();
  
  // 调试用：可以在background控制台查看记录的URL
  console.log('记录完整URL:', fullUrl);
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
      
      // 导航到历史记录（使用完整URL）
      chrome.tabs.update(tabId, { url: previousEntry.url });
      saveHistories();
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
      
      // 导航到历史记录（使用完整URL）
      chrome.tabs.update(tabId, { url: nextEntry.url });
      saveHistories();
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

// 可选：监听历史导航完成，确保记录成功
chrome.webNavigation ? chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  // 对于使用History API的SPA，确保记录
  if (details.url && !details.url.startsWith('chrome://')) {
    chrome.tabs.get(details.tabId, (tab) => {
      if (tab) {
        recordTabVisit(details.tabId, tab);
      }
    });
  }
}) : null;