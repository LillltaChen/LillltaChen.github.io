# LillltaChen Portfolio — 陈楠个人作品集

静态站点：AI 内容工作流设计师作品展示。

## 技术栈
- 纯静态：HTML + CSS + JS，无框架，无构建
- 背景视频：WebM（1.5MB pixel-blast-bg.webm）
- 字体：Google Fonts — Bitcount Prop Single（需本地化供国内访问）

## 项目结构
```
index.html          # 首页
style.css           # 全局样式
script.js           # 交互逻辑
about.js            # 关于页逻辑
about/              # 关于页面
ai-projects/        # 项目展示页（9个独立子目录）
assets/             # 图片/图标/字体资源
```

## Deploy Configuration (configured by /setup-deploy)
- Platform: EdgeOne Pages (Tencent Cloud) — 面向中国用户
- Project: chennan-portfolio (makers-xcnaepbtl9rz)
- Production URL: 待定（先部署，后绑定域名）
- Deploy workflow: `edgeone makers deploy` 命令行上传
- Git auto-deploy: 待配置 — 需在 EdgeOne 控制台关联 GitHub 仓库
- Merge method: squash
- Project type: static site
- Post-deploy health check: EdgeOne 默认域名或自定义域名 HTTP 200

### Custom deploy hooks
- Pre-merge: none
- Deploy trigger: `edgeone makers deploy . -a global -e production`
- Deploy status: EdgeOne 控制台查看
- Health check: 部署后访问 URL 确认页面正常加载

### 部署注意事项（中国用户）
1. Google Fonts 国内不可用 → 需本地化 Bitcount Prop Single 字体
2. 背景视频 1.5MB → 建议压缩或加 poster 图
3. ai-projects 视频 ~23MB → 建议懒加载 + preload="none"
4. 清理 .DS_Store → 确保 .gitignore 生效
