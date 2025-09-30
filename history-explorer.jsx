import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronRight, ChevronLeft, Download, Copy, Loader2, Calendar, Shuffle, Clock } from 'lucide-react';

const HistoryExplorer = () => {
  const [currentView, setCurrentView] = useState('cover'); // 从封面开始
  const [selectedDate, setSelectedDate] = useState(null); // 选中的日期
  const [mainEvents, setMainEvents] = useState([]); // 动态生成的事件列表
  const [cards, setCards] = useState([]); // 卡片系统：存储所有展开的内容卡片
  const [currentCardIndex, setCurrentCardIndex] = useState(0); // 当前查看的卡片索引
  const [expandedContent, setExpandedContent] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [allGeneratedContent, setAllGeneratedContent] = useState([]);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isGeneratingEvents, setIsGeneratingEvents] = useState(false);
  const [customDateInput, setCustomDateInput] = useState('');
  const scrollContainerRef = React.useRef(null);

  // 添加CSS样式隐藏滚动条
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // 格式化日期为中文
  const formatDate = (date) => {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 格式化日期为MM-DD格式
  const formatDateForPrompt = (date) => {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 生成历史事件列表
  const generateEventsList = async (date) => {
    setIsGeneratingEvents(true);
    const dateStr = formatDateForPrompt(date);
    
    const prompt = `请为${dateStr}这一天生成5个重要的历史事件。要求：

1. 每个事件必须真实发生在${dateStr}（任意年份）
2. 涵盖不同主题：科技、政治、文化、自然、社会等
3. 事件的重要性和影响力要有代表性
4. 以JSON格式返回，格式如下：

[
  {
    "year": 年份（数字）,
    "title": "事件简短标题",
    "emoji": "相关emoji（一个）",
    "category": "事件分类（2-4个字）",
    "description": "事件的简短描述（20-30字）"
  }
]

注意：
- 必须返回正好5个事件
- 按年份从早到晚排序
- emoji要贴切且有代表性
- 只返回JSON数组，不要有任何其他文字
- 确保是真实的历史事件`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [
            { role: "user", content: prompt }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const data = await response.json();
      let responseText = data.content[0].text;
      
      // 清理可能的markdown标记
      responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      const events = JSON.parse(responseText);
      
      // 转换为应用所需的格式
      const formattedEvents = events.map((event, index) => ({
        id: `event${index + 1}`,
        title: `${event.year}年 - ${event.title}`,
        emoji: event.emoji,
        category: event.category,
        description: event.description,
        prompt: `请用Luna的可爱猫娘学者风格，详细讲述${event.year}年${dateStr}${event.title}的历史事件。要求：
1. 保持Luna俏皮可爱的语气（使用"喵"作为语气词）
2. 使用生动的比喻和形象化描述
3. 讲述事件背景、经过和影响
4. 字数控制在300-400字
5. 最后提供3个相关的拓展了解方向，格式为：
【Luna的探索锚点】
💭 [具体概念] - [吸引人的描述]
🔗 [跨界知识] - [为什么有趣]
✨ [实际应用] - [现实意义]
请直接开始讲述，不要包含任何标题或前缀。`
      }));
      
      setMainEvents(formattedEvents);
      setSelectedDate(date);
      
      // 初始化卡片系统：主列表作为第一张卡片
      setCards([{
        id: 'main',
        type: 'main',
        title: `${formatDate(date)}的历史事件`,
        content: formattedEvents
      }]);
      setCurrentCardIndex(0);
      
      setCurrentView('main');
      setIsGeneratingEvents(false);
    } catch (error) {
      console.error("生成事件列表时出错:", error);
      setIsGeneratingEvents(false);
      alert(`喵呜...生成事件列表时出错了 (´•ω•̥\`)\n${error.message}\n请稍后再试试喵～`);
    }
  };

  // 处理"探索今天"
  const handleExploreToday = () => {
    const today = new Date();
    generateEventsList(today);
  };

  // 处理"随机一天"
  const handleRandomDay = () => {
    // 生成随机月份（1-12）和日期（1-31）
    const month = Math.floor(Math.random() * 12);
    const daysInMonth = new Date(2024, month + 1, 0).getDate(); // 获取该月的天数
    const day = Math.floor(Math.random() * daysInMonth) + 1;
    
    const randomDate = new Date(2024, month, day);
    generateEventsList(randomDate);
  };

  // 处理"指定日期"
  const handleCustomDate = () => {
    if (!customDateInput) {
      alert('请先输入日期喵～ (=^･ω･^=)');
      return;
    }
    
    try {
      // 解析输入的日期（格式：MM-DD 或 M-D）
      const parts = customDateInput.split('-');
      if (parts.length !== 2) {
        throw new Error('日期格式不正确');
      }
      
      const month = parseInt(parts[0]) - 1; // JavaScript月份从0开始
      const day = parseInt(parts[1]);
      
      if (month < 0 || month > 11 || day < 1 || day > 31) {
        throw new Error('日期超出范围');
      }
      
      const customDate = new Date(2024, month, day);
      
      // 验证日期有效性
      if (customDate.getMonth() !== month) {
        throw new Error('该月份没有这一天');
      }
      
      generateEventsList(customDate);
    } catch (error) {
      alert(`日期格式错误喵～ (´•ω•̥\`)\n请使用 MM-DD 格式，例如：01-01 或 12-25\n${error.message}`);
    }
  };
  const generateContent = async (prompt, itemId) => {
    setLoadingStates(prev => ({ ...prev, [itemId]: true }));
    
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [
            { role: "user", content: prompt }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content[0].text;
      
      // 保存生成的内容
      setExpandedContent(prev => ({ ...prev, [itemId]: content }));
      setAllGeneratedContent(prev => [...prev, { id: itemId, content }]);
      
      setLoadingStates(prev => ({ ...prev, [itemId]: false }));
      return content;
    } catch (error) {
      console.error("生成内容时出错:", error);
      setLoadingStates(prev => ({ ...prev, [itemId]: false }));
      return `喵呜...看起来遇到了一点小问题 (´•ω•̥\`) \n\n${error.message}\n\n请稍后再试试喵～`;
    }
  };

  // 解析拓展选项
  const parseExtensions = (content) => {
    const lines = content.split('\n');
    const extensions = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('💭') || line.startsWith('🔗') || line.startsWith('✨')) {
        extensions.push(line);
      }
    }
    
    return extensions.slice(0, 3); // 只取前3个
  };

  // 处理点击事件 - 添加新卡片
  const handleEventClick = async (event) => {
    // 创建新卡片
    const newCard = {
      id: event.id,
      type: 'detail',
      title: event.title,
      emoji: event.emoji,
      category: event.category,
      parentId: 'main',
      eventData: event
    };
    
    // 添加到卡片列表
    const newCards = [...cards, newCard];
    setCards(newCards);
    
    // 滚动到新卡片
    setCurrentCardIndex(newCards.length - 1);
    
    // 异步生成内容（不阻塞UI）
    if (!expandedContent[event.id]) {
      await generateContent(event.prompt, event.id);
    }
  };

  // 处理拓展点击 - 添加新卡片
  const handleExtensionClick = async (parentId, extensionText, index) => {
    const extensionId = `${parentId}_ext${index}`;
    
    // 创建新卡片
    const newCard = {
      id: extensionId,
      type: 'extension',
      title: extensionText,
      parentId: parentId
    };
    
    // 添加到卡片列表
    const newCards = [...cards, newCard];
    setCards(newCards);
    
    // 滚动到新卡片
    setCurrentCardIndex(newCards.length - 1);
    
    // 异步生成内容
    if (!expandedContent[extensionId]) {
      const extensionPrompt = `请用Luna的可爱猫娘学者风格，详细讲述关于"${extensionText}"的内容。要求：
1. 保持Luna俏皮可爱的语气（使用"喵"作为语气词）
2. 使用生动的比喻和形象化描述
3. 深入浅出地解释这个概念或知识点
4. 字数控制在300-400字
5. 最后提供3个相关的拓展了解方向，格式为：
【Luna的探索锚点】
💭 [具体概念] - [吸引人的描述]
🔗 [跨界知识] - [为什么有趣]
✨ [实际应用] - [现实意义]
请直接开始讲述，不要包含任何标题或前缀。`;
      
      await generateContent(extensionPrompt, extensionId);
    }
  };

  // 返回主列表
  const handleBackToMain = () => {
    setCurrentCardIndex(0);
  };

  // 滚动到指定卡片
  useEffect(() => {
    if (scrollContainerRef.current && currentCardIndex >= 0) {
      const container = scrollContainerRef.current;
      const cardWidth = container.offsetWidth;
      container.scrollTo({
        left: cardWidth * currentCardIndex,
        behavior: 'smooth'
      });
    }
  }, [currentCardIndex]);

  // 导出所有内容
  const exportAllContent = () => {
    const dateStr = selectedDate ? formatDate(selectedDate) : '未知日期';
    let exportText = `✨ Luna的历史探索记录 - ${dateStr} ✨\n`;
    exportText += `生成时间: ${new Date().toLocaleString('zh-CN')}\n`;
    exportText += `${'='.repeat(50)}\n\n`;
    
    allGeneratedContent.forEach((item, index) => {
      const eventInfo = mainEvents.find(e => e.id === item.id);
      if (eventInfo) {
        exportText += `【${eventInfo.category}】${eventInfo.title}\n\n`;
      } else {
        exportText += `【拓展内容 #${index + 1}】\n\n`;
      }
      exportText += `${item.content}\n\n`;
      exportText += `${'-'.repeat(50)}\n\n`;
    });
    
    return exportText;
  };

  // 复制到剪贴板
  const copyToClipboard = () => {
    const text = exportAllContent();
    navigator.clipboard.writeText(text).then(() => {
      alert('已复制到剪贴板喵～ (ฅ^•ﻌ•^ฅ)');
    });
  };

  // 渲染封面页面
  const renderCoverView = () => (
    <div className="min-h-[600px] flex flex-col items-center justify-center space-y-8">
      {/* 主标题 */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <Sparkles className="w-12 h-12 text-purple-400 animate-pulse" />
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            历史上的今天
          </h1>
          <Sparkles className="w-12 h-12 text-pink-400 animate-pulse" />
        </div>
        <p className="text-xl text-gray-300">✨ Luna的量子时光机器 ✨</p>
        <p className="text-sm text-gray-400">选择一个日期，让我为你讲述那天的历史故事喵～ (ฅ^•ﻌ•^ฅ)</p>
      </div>

      {/* 三个选项 */}
      <div className="grid gap-6 w-full max-w-2xl">
        {/* 探索今天 */}
        <button
          onClick={handleExploreToday}
          disabled={isGeneratingEvents}
          className="group relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl p-8 transition-all duration-300 shadow-lg hover:shadow-purple-500/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <div className="flex items-center gap-6">
            <div className="bg-white/10 rounded-full p-4">
              <Clock className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-2xl font-bold text-white mb-2">探索今天</h3>
              <p className="text-purple-100">了解{formatDate(new Date())}发生的历史事件</p>
            </div>
            <ChevronRight className="w-8 h-8 text-white group-hover:translate-x-2 transition-transform" />
          </div>
        </button>

        {/* 随机一天 */}
        <button
          onClick={handleRandomDay}
          disabled={isGeneratingEvents}
          className="group relative bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-2xl p-8 transition-all duration-300 shadow-lg hover:shadow-blue-500/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <div className="flex items-center gap-6">
            <div className="bg-white/10 rounded-full p-4">
              <Shuffle className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-2xl font-bold text-white mb-2">随机一天</h3>
              <p className="text-blue-100">让量子随机性选择一个神秘日期</p>
            </div>
            <ChevronRight className="w-8 h-8 text-white group-hover:translate-x-2 transition-transform" />
          </div>
        </button>

        {/* 指定日期 */}
        <div className="group relative bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-2xl p-8 transition-all duration-300 shadow-lg hover:shadow-emerald-500/50">
          <div className="flex items-center gap-6">
            <div className="bg-white/10 rounded-full p-4">
              <Calendar className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white mb-3">指定日期</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={customDateInput}
                  onChange={(e) => setCustomDateInput(e.target.value)}
                  placeholder="MM-DD (例如: 01-01)"
                  disabled={isGeneratingEvents}
                  className="flex-1 bg-white/20 border-2 border-white/30 rounded-lg px-4 py-2 text-white placeholder-white/60 focus:outline-none focus:border-white/60 disabled:opacity-50"
                />
                <button
                  onClick={handleCustomDate}
                  disabled={isGeneratingEvents}
                  className="bg-white/20 hover:bg-white/30 rounded-lg px-6 py-2 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  探索
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 加载状态 */}
      {isGeneratingEvents && (
        <div className="flex flex-col items-center gap-4 mt-8">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          <p className="text-gray-400 text-lg">Luna正在时光长河中寻找历史的痕迹喵～ (=^･ω･^=)</p>
          <p className="text-gray-500 text-sm">这可能需要几秒钟...</p>
        </div>
      )}

      {/* 底部提示 */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>💫 每个日期都有独特的故事等待探索</p>
        <p className="mt-2">Luna会用俏皮可爱的方式为你讲述历史喵～</p>
      </div>
    </div>
  );

  // 渲染主视图（卡片滚动系统）
  const renderMainView = () => (
    <div className="space-y-4">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setCurrentView('cover');
            setMainEvents([]);
            setCards([]);
            setExpandedContent({});
            setAllGeneratedContent([]);
            setCurrentCardIndex(0);
            setCustomDateInput('');
          }}
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          返回日期选择
        </button>
        
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-200">
            {selectedDate ? formatDate(selectedDate) : ''}
          </p>
          <p className="text-xs text-gray-400">
            卡片 {currentCardIndex + 1} / {cards.length}
          </p>
        </div>
        
        <div className="w-28"></div> {/* 占位保持居中 */}
      </div>

      {/* 使用指南 */}
      {showInstructions && (
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-4 border border-purple-500/30">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <h3 className="font-semibold text-purple-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                使用指南
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li>点击事件后会添加新卡片，自动滚动到新卡片位置</li>
                <li>可以随时左右滑动查看所有卡片内容</li>
                <li>生成内容时不会打断你的浏览</li>
                <li>点击底部圆点或使用左右箭头快速导航</li>
              </ul>
            </div>
            <button
              onClick={() => setShowInstructions(false)}
              className="text-gray-400 hover:text-gray-300 ml-4"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 卡片容器 - 横向滚动 */}
      <div className="relative">
        {/* 左箭头 */}
        {currentCardIndex > 0 && (
          <button
            onClick={() => setCurrentCardIndex(prev => Math.max(0, prev - 1))}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-purple-600 hover:bg-purple-700 rounded-full p-3 shadow-lg transition-all"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}

        {/* 右箭头 */}
        {currentCardIndex < cards.length - 1 && (
          <button
            onClick={() => setCurrentCardIndex(prev => Math.min(cards.length - 1, prev + 1))}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-purple-600 hover:bg-purple-700 rounded-full p-3 shadow-lg transition-all"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}

        {/* 滚动容器 */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex" style={{ width: `${cards.length * 100}%` }}>
            {cards.map((card, index) => (
              <div
                key={card.id}
                className="snap-center flex-shrink-0"
                style={{ width: `${100 / cards.length}%`, padding: '0 8px' }}
              >
                <div className="h-full">
                  {renderCard(card)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部导航点 */}
      {cards.length > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          {cards.map((card, index) => (
            <button
              key={card.id}
              onClick={() => setCurrentCardIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentCardIndex
                  ? 'w-8 bg-purple-500'
                  : 'w-2 bg-gray-600 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );

  // 渲染单个卡片
  const renderCard = (card) => {
    if (card.type === 'main') {
      // 主列表卡片
      return (
        <div className="bg-gray-800/50 rounded-lg p-6 min-h-[500px]">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-gray-100">{card.title}</h2>
              <Sparkles className="w-6 h-6 text-pink-400" />
            </div>
            <p className="text-sm text-gray-400">由Luna为你讲述的历史故事 (ฅ^•ﻌ•^ฅ)</p>
          </div>

          <div className="grid gap-4">
            {card.content.map((event) => (
              <button
                key={event.id}
                onClick={() => handleEventClick(event)}
                className="group relative bg-gradient-to-r from-gray-700 to-gray-800 hover:from-purple-900/50 hover:to-pink-900/50 rounded-lg p-5 text-left transition-all duration-300 border border-gray-600 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{event.emoji}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                        {event.category}
                      </span>
                      {expandedContent[event.id] && (
                        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded-full border border-green-500/30">
                          ✓ 已生成
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-gray-100 group-hover:text-purple-300 transition-colors mb-1">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-sm text-gray-400">{event.description}</p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    } else if (card.type === 'detail' || card.type === 'extension') {
      // 详细内容卡片
      const content = expandedContent[card.id];
      const isLoading = loadingStates[card.id];
      const extensions = content ? parseExtensions(content) : [];

      return (
        <div className="bg-gray-800/50 rounded-lg p-6 min-h-[500px]">
          {/* 卡片头部 */}
          <div className="mb-6">
            {card.type === 'detail' && (
              <div className="text-center space-y-2">
                <div className="text-4xl">{card.emoji}</div>
                <h2 className="text-xl font-bold text-gray-100">{card.title}</h2>
                <span className="inline-block text-xs px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                  {card.category}
                </span>
              </div>
            )}
            {card.type === 'extension' && (
              <div className="text-center">
                <h2 className="text-lg font-semibold text-purple-300">{card.title}</h2>
              </div>
            )}
          </div>

          {/* 内容区域 */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
              <p className="text-gray-400">Luna正在翻阅历史典籍喵～ (=^･ω･^=)</p>
              <p className="text-sm text-gray-500">你可以滑动查看其他卡片哦～</p>
            </div>
          ) : content ? (
            <div className="space-y-6">
              <div className="bg-gray-900/50 rounded-lg p-5 border border-gray-700">
                <div className="prose prose-invert max-w-none">
                  <div className="text-gray-200 leading-relaxed whitespace-pre-wrap text-sm">
                    {content}
                  </div>
                </div>
              </div>

              {extensions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-purple-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    继续探索
                  </h3>
                  <div className="grid gap-3">
                    {extensions.map((ext, index) => {
                      const extensionId = `${card.id}_ext${index}`;
                      const isVisited = !!expandedContent[extensionId];

                      return (
                        <button
                          key={index}
                          onClick={() => handleExtensionClick(card.id, ext, index)}
                          className="group bg-gradient-to-r from-gray-700 to-gray-800 hover:from-purple-900/30 hover:to-pink-900/30 rounded-lg p-4 text-left transition-all duration-300 border border-gray-600 hover:border-purple-500"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="text-sm text-gray-200 group-hover:text-purple-300 transition-colors">
                                {ext}
                              </div>
                              {isVisited && (
                                <span className="inline-block mt-2 text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded-full border border-green-500/30">
                                  ✓ 已生成
                                </span>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              出现了一点小问题喵... (´•ω•̥`)
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 顶部工具栏 - 只在非封面页显示 */}
        {currentView !== 'cover' && allGeneratedContent.length > 0 && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
              复制全部内容
            </button>
          </div>
        )}

        {/* 主内容区域 */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800 shadow-2xl">
          {currentView === 'cover' ? renderCoverView() : renderMainView()}
        </div>

        {/* 底部签名 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>✨ Powered by Luna · 量子思维历史探索器 ✨</p>
          <p className="mt-1">愿历史的智慧照亮未来的道路喵～ (ฅ´ω`ฅ)</p>
        </div>
      </div>
    </div>
  );
};

export default HistoryExplorer;