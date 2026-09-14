# 灵搜AI 极简商城

面向 AI 数字服务的轻量商城。支持游客下单、双语/双币展示、四类交付、Mock 支付、订单安全查询及完整管理后台。

## 本地运行

```bash
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

- 商城：http://localhost:3000
- 管理后台：http://localhost:3000/admin
- 本地种子管理员由 `.env` 中的 `ADMIN_EMAIL` / `ADMIN_PASSWORD` 决定。

首次启动前必须修改 `AUTH_SECRET` 与管理员密码。`.env` 已被 Git 忽略，不要提交数据库密码或生产凭证。

## 核心命令

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run db:studio
```

## 支付与交付

V1 使用 Mock Payment Provider，但支付确认仍执行服务端签名、金额/币种校验、事件幂等与事务发货。真实支付渠道应在 `src/lib/payment/` 新增适配器，不能让前端直接修改订单状态。

交付类型：

- `CODE`：从库存池原子领取一条。
- `TEXT`：交付预设文本或独立库存文本。
- `LINK`：交付后台配置的资源链接。
- `MANUAL`：进入后台待处理队列，由管理员填写结果。

## 部署

生产环境推荐 VPS + Docker + Cloudflare。复制 `.env.example` 配置生产变量后运行：

```bash
docker compose up -d --build
docker compose exec app npx prisma db push
```

售后工单回复会通过 SMTP 发给用户。在 `.env` 中配置 `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM`，可在后台「售后工单」页发送测试邮件。发件地址需是邮件服务商已验证的发件人。

正式上线前还需完成真实支付渠道、域名、HTTPS、Cloudflare 限流以及日志采集配置。

## 备份

至少每日备份 MySQL，并定期验证恢复：

```bash
mysqldump --single-transaction --routines --triggers \
  -h localhost -u root -p shangdian_ai_store \
  | gzip > "shangdian_ai_store-$(date +%F).sql.gz"
```

备份文件应加密并同步到与服务器隔离的对象存储，保留 7 份日备份和 4 份周备份。库存交付内容和订单数据都属于敏感业务数据，不应放入公开仓库。
