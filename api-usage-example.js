// 前端调用 DeepSeek API 的示例代码
// 请将此代码集成到你的 call.html 中

/**
 * 调用 DeepSeek API（流式返回）
 * @param {Array} messages - 对话消息数组
 * @param {Function} onChunk - 接收每个数据块的回调函数
 * @param {Function} onComplete - 完成时的回调函数
 * @param {Function} onError - 错误时的回调函数
 */
let currentController = null; // 用于存储当前的 AbortController

async function callDeepSeekAPI(messages, onChunk, onComplete, onError) {
  // 如果有正在进行的请求，先取消它
  if (currentController) {
    currentController.abort();
  }

  // 创建新的 AbortController
  currentController = new AbortController();
  const signal = currentController.signal;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages,
        stream: true,
        model: 'deepseek-chat'
      }),
      signal: signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'API request failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = ''; // 用于拼接跨 chunk 的数据
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // 处理 buffer 中剩余的数据
        if (buffer.trim()) {
          processSSEData(buffer, (content) => {
            fullText += content;
            if (onChunk) onChunk(content);
          });
        }

        if (onComplete) onComplete(fullText);
        break;
      }

      // 将新数据追加到 buffer
      buffer += decoder.decode(value, { stream: true });

      // 按 '\n\n' 分割事件
      const events = buffer.split('\n\n');

      // 保留最后一个可能不完整的事件
      buffer = events.pop() || '';

      // 处理每个完整的事件
      for (const event of events) {
        processSSEData(event, (content) => {
          fullText += content;
          if (onChunk) onChunk(content);
        });
      }
    }
  } catch (error) {
    // 如果是主动取消，不报错
    if (error.name === 'AbortError') {
      console.log('请求已取消');
      return;
    }

    console.error('API 调用错误:', error);
    if (onError) onError(error);
  } finally {
    // 清理 controller
    currentController = null;
  }
}

/**
 * 处理 SSE 事件数据
 * @param {string} event - SSE 事件字符串
 * @param {Function} onContent - 内容回调函数
 */
function processSSEData(event, onContent) {
  const lines = event.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6).trim();

      if (data === '[DONE]') {
        continue;
      }

      try {
        const parsed = JSON.parse(data);

        // 兼容两种格式：
        // 1) {"delta":"内容"}
        // 2) {"choices":[{"delta":{"content":"内容"}}]}
        let content = null;

        if (parsed.delta) {
          // 格式 1: 直接的 delta
          content = parsed.delta;
        } else if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
          // 格式 2: OpenAI 格式
          content = parsed.choices[0].delta.content;
        }

        if (content) {
          onContent(content);
        }
      } catch (e) {
        console.warn('解析 SSE 数据失败:', e, '原始数据:', data);
      }
    }
  }
}

// ====== 使用示例 ======

// 示例 1: 基本使用
const messages = [
  { role: 'system', content: '你是一个友善的助手' },
  { role: 'user', content: '你好' }
];

callDeepSeekAPI(
  messages,
  (chunk) => {
    console.log('收到新内容:', chunk);
    // 在这里更新 UI，例如追加到字幕框
  },
  (fullText) => {
    console.log('完整回复:', fullText);
    // 流式传输完成
  },
  (error) => {
    console.error('发生错误:', error);
    // 处理错误
  }
);

// 示例 2: 集成到现有的 ConversationEngine
/*
const ConversationEngine = {
  async next(state) {
    const userText = state.user.lastUtterance;

    // 构建消息历史
    const messages = [
      {
        role: 'system',
        content: '你是"没人接"应用中的AI助手。你的任务是关心用户的安全，...'
      },
      ...state.conversationHistory, // 如果有历史记录
      {
        role: 'user',
        content: userText
      }
    ];

    // 调用 API 并实时显示
    let currentReply = '';

    await callDeepSeekAPI(
      messages,
      (chunk) => {
        currentReply += chunk;
        // 实时更新字幕
        sayLine(currentReply);
      },
      (fullText) => {
        // 完成，保存到历史记录
        state.conversationHistory.push(
          { role: 'user', content: userText },
          { role: 'assistant', content: fullText }
        );
      },
      (error) => {
        sayLine('抱歉，我遇到了一点问题，请稍后再试');
      }
    );

    return { text: currentReply, delayMs: 0 };
  }
};
*/

// 示例 3: 实时流式字幕显示
/*
async function streamAIResponse(userMessage) {
  const messages = [
    { role: 'system', content: '你是一个关心用户安全的助手' },
    { role: 'user', content: userMessage }
  ];

  const box = ensureSubtitleBox();
  box.style.display = 'block';
  box.classList.remove('idle');
  box.textContent = '正在思考...';

  let displayedText = '';

  await callDeepSeekAPI(
    messages,
    (chunk) => {
      displayedText += chunk;
      box.textContent = displayedText;
    },
    () => {
      // 完成后 10 秒淡出
      setTimeout(() => {
        box.classList.add('idle');
      }, 10000);
    },
    (error) => {
      box.textContent = '抱歉，出现问题，请重试';
    }
  );
}
*/

// ====== 测试工具函数 ======

// 测试 API 连接
async function testAPIConnection() {
  console.log('测试 API 连接...');

  await callDeepSeekAPI(
    [{ role: 'user', content: '你好，请回复"连接成功"' }],
    (chunk) => console.log('>', chunk),
    (fullText) => console.log('✅ 连接成功！完整回复:', fullText),
    (error) => console.error('❌ 连接失败:', error)
  );
}

// 在控制台运行 testAPIConnection() 来测试
