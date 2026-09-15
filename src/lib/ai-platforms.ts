export type AiPlatform = {
  nameZh: string;
  nameEn: string;
  vendorZh: string;
  vendorEn: string;
  href: string;
  icon: string;
  darkMark?: boolean;
};

export const domesticPlatforms: AiPlatform[] = [
  { nameZh: "DeepSeek", nameEn: "DeepSeek", vendorZh: "深度求索", vendorEn: "DeepSeek", href: "https://chat.deepseek.com/", icon: "/brand/platforms/deepseek.svg" },
  { nameZh: "Kimi", nameEn: "Kimi", vendorZh: "月之暗面", vendorEn: "Moonshot", href: "https://kimi.moonshot.cn/", icon: "/brand/platforms/kimi.webp" },
  { nameZh: "豆包", nameEn: "Doubao", vendorZh: "字节跳动", vendorEn: "ByteDance", href: "https://www.doubao.com/", icon: "/brand/platforms/doubao.png" },
  { nameZh: "通义千问", nameEn: "Qwen", vendorZh: "阿里巴巴", vendorEn: "Alibaba", href: "https://tongyi.aliyun.com/", icon: "/brand/platforms/qwen.png" },
  { nameZh: "腾讯元宝", nameEn: "Yuanbao", vendorZh: "腾讯", vendorEn: "Tencent", href: "https://yuanbao.tencent.com/", icon: "/brand/platforms/yuanbao.png" },
  { nameZh: "腾讯混元", nameEn: "Hunyuan", vendorZh: "腾讯", vendorEn: "Tencent", href: "https://hunyuan.tencent.com/", icon: "/brand/platforms/hunyuan.svg" },
  { nameZh: "智谱清言", nameEn: "ChatGLM", vendorZh: "智谱 AI", vendorEn: "Zhipu AI", href: "https://chatglm.cn/", icon: "/brand/platforms/zhipu.png" },
  { nameZh: "文心一言", nameEn: "ERNIE", vendorZh: "百度", vendorEn: "Baidu", href: "https://yiyan.baidu.com/", icon: "/brand/platforms/yiyan.png" },
  { nameZh: "讯飞星火", nameEn: "Spark", vendorZh: "科大讯飞", vendorEn: "iFlytek", href: "https://xinghuo.xfyun.cn/", icon: "/brand/platforms/xinghuo.ico" },
  { nameZh: "即梦 AI", nameEn: "Jimeng", vendorZh: "字节 · 生图", vendorEn: "ByteDance · Image", href: "https://jimeng.jianying.com/", icon: "/brand/platforms/jimeng.png", darkMark: true },
  { nameZh: "可灵 AI", nameEn: "Kling", vendorZh: "快手 · 视频", vendorEn: "Kuaishou · Video", href: "https://klingai.com/", icon: "/brand/platforms/keling.png" },
  { nameZh: "海螺 AI", nameEn: "Hailuo", vendorZh: "MiniMax", vendorEn: "MiniMax", href: "https://hailuoai.com/", icon: "/brand/platforms/hailuo.png" },
  { nameZh: "秘塔 AI", nameEn: "Metaso", vendorZh: "AI 搜索", vendorEn: "AI Search", href: "https://metaso.cn/", icon: "/brand/platforms/metaso.png" },
  { nameZh: "天工 AI", nameEn: "Tiangong", vendorZh: "昆仑万维", vendorEn: "Kunlun", href: "https://www.tiangong.cn/", icon: "/brand/platforms/tiangong.png" },
  { nameZh: "百川智能", nameEn: "Baichuan", vendorZh: "百川", vendorEn: "Baichuan", href: "https://www.baichuan-ai.com/", icon: "/brand/platforms/baichuan.png" },
  { nameZh: "商量", nameEn: "SenseChat", vendorZh: "商汤科技", vendorEn: "SenseTime", href: "https://chat.sensetime.com/", icon: "/brand/platforms/sensetime.png" },
  { nameZh: "纳米 AI", nameEn: "Nano AI", vendorZh: "360", vendorEn: "360", href: "https://www.n.cn/", icon: "/brand/platforms/nano.png" },
  { nameZh: "阶跃星辰", nameEn: "StepFun", vendorZh: "跃问", vendorEn: "Yuewen", href: "https://www.stepfun.com/", icon: "/brand/platforms/stepfun.svg", darkMark: true },
];

export const internationalPlatforms: AiPlatform[] = [
  { nameZh: "ChatGPT", nameEn: "ChatGPT", vendorZh: "OpenAI", vendorEn: "OpenAI", href: "https://chatgpt.com/", icon: "/brand/platforms/chatgpt.svg" },
  { nameZh: "Claude", nameEn: "Claude", vendorZh: "Anthropic", vendorEn: "Anthropic", href: "https://claude.ai/", icon: "/brand/platforms/claude.png" },
  { nameZh: "Gemini", nameEn: "Gemini", vendorZh: "Google", vendorEn: "Google", href: "https://gemini.google.com/", icon: "/brand/platforms/gemini.svg" },
  { nameZh: "Grok", nameEn: "Grok", vendorZh: "xAI", vendorEn: "xAI", href: "https://grok.com/", icon: "/brand/platforms/grok.svg" },
  { nameZh: "Perplexity", nameEn: "Perplexity", vendorZh: "AI 搜索", vendorEn: "AI Search", href: "https://www.perplexity.ai/", icon: "/brand/platforms/perplexity.svg" },
  { nameZh: "Cursor", nameEn: "Cursor", vendorZh: "AI 编程", vendorEn: "AI Coding", href: "https://cursor.com/", icon: "/brand/platforms/cursor.svg" },
  { nameZh: "GitHub Copilot", nameEn: "GitHub Copilot", vendorZh: "微软", vendorEn: "Microsoft", href: "https://github.com/features/copilot", icon: "/brand/platforms/copilot.svg" },
];
