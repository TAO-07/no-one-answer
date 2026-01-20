# DeepSeek API 配置说明

## 📁 文件结构

```
没人接/
├── api/
│   └── chat.js                 # Vercel Serverless Function（已创建）
├── call.html                   # 前端页面（需要集成）
├── api-usage-example.js        # 前端调用示例代码（已创建）
└── README-API-SETUP.md         # 本文件
```

## 🔑 步骤 1: 获取 DeepSeek API Key

1. 访问 [DeepSeek 官网](https://www.deepseek.com/)
2. 注册并登录账号
3. 进入 API Keys 页面
4. 创建新的 API Key
5. **重要**: 复制并保存好你的 API Key（只显示一次）

## 🚀 步骤 2: 部署到 Vercel

### 方式 A: 通过 Vercel CLI（推荐）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 在项目根目录运行
cd "c:\codes\没人接"
vercel

# 按提示操作：
# - 登录 Vercel 账号
# - 选择项目设置
# - 确认部署
```

### 方式 B: 通过 Vercel 网站部署

1. 访问 [vercel.com](https://vercel.com/)
2. 登录并点击 "New Project"
3. 导入你的 GitHub 仓库或上传文件夹
4. Vercel 会自动检测 `api/` 目录

## ⚙️ 步骤 3: 配置环境变量

### 在 Vercel 控制台配置：

1. 进入项目页面
2. 点击 **Settings** → **Environment Variables**
3. 添加以下变量：

| Key | Value | Environment |
|-----|-------|-------------|
| `DEEPSEEK_API_KEY` | `你的实际API-Key` | Production, Preview, Development |

4. 点击 **Save**
5. **重要**: 重新部署项目以应用环境变量
   - 在 **Deployments** 页面找到最新部署
   - 点击右侧三个点 → **Redeploy**

## ✅ 步骤 4: 测试 API

### 方法 1: 使用浏览器控制台

1. 访问部署后的网站（例如: `https://your-project.vercel.app/call.html`）
2. 打开浏览器开发者工具（F12）
3. 在控制台粘贴并运行：

```javascript
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: '你好' }]
  })
})
.then(r => r.json())
.then(d => console.log('✅ 成功:', d))
.catch(e => console.error('❌ 失败:', e))
```

### 方法 2: 使用 cURL

```bash
curl -X POST https://your-project.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"你好"}]}'
```

## 🔧 步骤 5: 集成到前端

### 在 `call.html` 中添加流式调用代码

找到 `<script>` 标签内的 `ConversationEngine` 对象，修改为：

```javascript
const ConversationEngine = {
  async next(state) {
    const userText = state.user.lastUtterance;

    // 构建消息
    const messages = [
      {
        role: 'system',
        content: '你是"没人接"应用中的AI助手。你的任务是关心用户的安全...'
      },
      {
        role: 'user',
        content: userText
      }
    ];

    // 调用 API
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, stream: true })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    // 创建字幕框
    const box = ensureSubtitleBox();
    box.style.display = 'block';
    box.classList.remove('idle');

    // 读取流式数据
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              box.textContent = fullText;
            }
          } catch (e) {}
        }
      }
    }

    return { text: fullText, delayMs: 0 };
  }
};
```

## 🛡️ 安全注意事项

✅ **已做的安全措施：**
- API Key 存储在服务端环境变量
- 前端无法访问 API Key
- 使用 Vercel Edge Runtime 加速响应

❌ **不要做的：**
- 不要把 API Key 写在前端代码中
- 不要把 API Key 提交到 Git 仓库
- 不要在公开代码中暴露 API Key

## 📊 API 使用限制

| 计划 | 免费额度 | 价格 |
|------|---------|------|
| DeepSeek | 查看官网 | 按使用量计费 |

建议在 Vercel 中设置速率限制以防止滥用。

## 🐛 常见问题

### 1. "API configuration error"
- **原因**: 环境变量未设置
- **解决**: 检查 Vercel 控制台的环境变量设置

### 2. 404 错误
- **原因**: `api/` 目录未部署
- **解决**: 确保 `api/chat.js` 在项目根目录下

### 3. 流式数据不显示
- **原因**: 前端解析错误
- **解决**: 检查浏览器控制台的错误信息

### 4. CORS 错误
- **原因**: Vercel Edge Runtime 已自动处理
- **解决**: 确保使用 `runtime: 'edge'`

## 📚 相关链接

- [Vercel Edge Functions 文档](https://vercel.com/docs/concepts/functions/edge-functions)
- [DeepSeek API 文档](https://platform.deepseek.com/api-docs/)
- [Server-Sent Events (SSE) 规范](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

## 💡 下一步

1. ✅ 完成 Vercel 部署
2. ✅ 配置环境变量
3. ✅ 测试 API 连接
4. ⬜ 集成到 call.html
5. ⬜ 添加错误处理
6. ⬜ 优化流式显示效果
