/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");

const prisma = new PrismaClient();

async function upsertVariant(productId, data, prices) {
  const variant = await prisma.productVariant.upsert({
    where: { sku: data.sku },
    update: { ...data, productId },
    create: { ...data, productId },
  });
  for (const [currency, amountMinor] of Object.entries(prices)) {
    await prisma.variantPrice.upsert({
      where: { variantId_currency: { variantId: variant.id, currency } },
      update: { amountMinor, active: true },
      create: { variantId: variant.id, currency, amountMinor },
    });
  }
  return variant;
}

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@shangdian.ai").toLowerCase();
  const passwordHash = await hash(process.env.ADMIN_PASSWORD || "ShangdianAI2026!", 12);
  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { passwordHash, active: true },
    create: { email: adminEmail, passwordHash, name: "灵搜AI 管理员" },
  });

  const categoryData = [
    ["ai-subscriptions", "AI 会员服务", "AI Subscriptions", 10],
    ["api-services", "API 与开发者服务", "API & Developer", 20],
    ["digital-resources", "数字资源与工具", "Digital Resources", 30],
  ];
  const categories = {};
  for (const [slug, nameZh, nameEn, sort] of categoryData) {
    categories[slug] = await prisma.category.upsert({
      where: { slug },
      update: { nameZh, nameEn, sort, status: "ACTIVE" },
      create: { slug, nameZh, nameEn, sort, status: "ACTIVE" },
    });
  }

  const products = [
    {
      slug: "chatgpt-plus-service",
      category: "ai-subscriptions",
      nameZh: "ChatGPT Plus 会员服务",
      nameEn: "ChatGPT Plus Service",
      shortDescZh: "适合日常创作、学习与高频 AI 工作流的会员服务。",
      shortDescEn: "A membership service for creation, learning and everyday AI workflows.",
      descriptionZh: "提供清晰的下单指引与人工处理服务。提交订单后，工作人员将根据订单信息联系并完成服务。\n\n预计处理时间：工作时段内 30–120 分钟。",
      descriptionEn: "Clear checkout guidance with manual fulfillment. Our team will process the service using the contact details in your order.",
      badge: "热门",
      featured: true,
      variant: { nameZh: "1 个月", nameEn: "1 month", sku: "GPT-PLUS-1M", deliveryType: "MANUAL", stockMode: "MANUAL", deliveryContent: null },
      prices: { CNY: 13800, USD: 1999 },
    },
    {
      slug: "claude-pro-service",
      category: "ai-subscriptions",
      nameZh: "Claude Pro 会员服务",
      nameEn: "Claude Pro Service",
      shortDescZh: "面向长文本、代码分析和知识工作的专业 AI 服务。",
      shortDescEn: "Professional AI service for long documents, coding and knowledge work.",
      descriptionZh: "适合需要长上下文、文档分析与编程辅助的用户。该商品由工作人员人工确认并交付。",
      descriptionEn: "Ideal for long-context analysis, documents and coding. Fulfilled manually after confirmation.",
      badge: "专业",
      featured: true,
      variant: { nameZh: "1 个月", nameEn: "1 month", sku: "CLAUDE-PRO-1M", deliveryType: "MANUAL", stockMode: "MANUAL", deliveryContent: null },
      prices: { CNY: 15800, USD: 2199 },
    },
    {
      slug: "api-credit-pack",
      category: "api-services",
      nameZh: "AI API 开发额度包",
      nameEn: "AI API Credit Pack",
      shortDescZh: "用于测试与开发的 API 额度兑换码，付款后自动交付。",
      shortDescEn: "API credit redemption code for testing and development, delivered automatically.",
      descriptionZh: "适用于个人开发者和小型原型验证。付款成功后，系统会从库存池自动发放一条唯一兑换码。",
      descriptionEn: "For developers and rapid prototypes. A unique redemption code is delivered automatically after payment.",
      badge: "自动交付",
      featured: true,
      variant: { nameZh: "100 元额度", nameEn: "CNY 100 credit", sku: "API-CREDIT-100", deliveryType: "CODE", stockMode: "INVENTORY", deliveryContent: null },
      prices: { CNY: 9800, USD: 1499 },
      inventory: Array.from({ length: 12 }, (_, index) => `DEMO-API-${String(index + 1).padStart(4, "0")}-REPLACE-BEFORE-LAUNCH`),
    },
    {
      slug: "ai-prompt-library",
      category: "digital-resources",
      nameZh: "AI 高效提示词资料库",
      nameEn: "AI Prompt Library",
      shortDescZh: "覆盖写作、运营、办公与开发场景的结构化提示词资源。",
      shortDescEn: "Structured prompt resources for writing, operations, office work and development.",
      descriptionZh: "持续整理的提示词与工作流资料，适合希望快速建立高质量 AI 使用方法的用户。",
      descriptionEn: "A curated prompt and workflow library for building effective AI habits quickly.",
      badge: "即买即用",
      featured: true,
      variant: { nameZh: "永久访问", nameEn: "Lifetime access", sku: "PROMPT-LIB-LIFE", deliveryType: "LINK", stockMode: "UNLIMITED", deliveryContent: "演示交付链接：https://example.com/shangdian-ai-demo\n上线前请在后台替换为真实、已授权的资源链接。" },
      prices: { CNY: 3900, USD: 599 },
    },
  ];

  for (const item of products) {
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        categoryId: categories[item.category].id,
        nameZh: item.nameZh,
        nameEn: item.nameEn,
        shortDescZh: item.shortDescZh,
        shortDescEn: item.shortDescEn,
        descriptionZh: item.descriptionZh,
        descriptionEn: item.descriptionEn,
        purchaseNotice: "下单前请确认套餐、邮箱和联系方式。数字服务一经交付，不支持无理由退换。",
        purchaseNoticeEn: "Please confirm the plan, email and contact details before ordering. Digital services are non-refundable once delivered.",
        afterSale: "如交付内容存在问题，请在订单页提交售后工单。人工服务以商品页标注的处理时效为准。",
        afterSaleEn: "If the delivered content has an issue, submit a support ticket from the order page. Manual processing times follow the product page.",
        badge: item.badge,
        featured: item.featured,
        status: "ACTIVE",
      },
      create: {
        categoryId: categories[item.category].id,
        nameZh: item.nameZh,
        nameEn: item.nameEn,
        slug: item.slug,
        shortDescZh: item.shortDescZh,
        shortDescEn: item.shortDescEn,
        descriptionZh: item.descriptionZh,
        descriptionEn: item.descriptionEn,
        purchaseNotice: "下单前请确认套餐、邮箱和联系方式。数字服务一经交付，不支持无理由退换。",
        purchaseNoticeEn: "Please confirm the plan, email and contact details before ordering. Digital services are non-refundable once delivered.",
        afterSale: "如交付内容存在问题，请在订单页提交售后工单。人工服务以商品页标注的处理时效为准。",
        afterSaleEn: "If the delivered content has an issue, submit a support ticket from the order page. Manual processing times follow the product page.",
        badge: item.badge,
        featured: item.featured,
        status: "ACTIVE",
      },
    });
    const variant = await upsertVariant(product.id, item.variant, item.prices);
    if (item.inventory && await prisma.inventoryItem.count({ where: { variantId: variant.id } }) === 0) {
      await prisma.inventoryItem.createMany({ data: item.inventory.map((content) => ({ variantId: variant.id, content })) });
    }
  }

  await prisma.announcement.upsert({
    where: { id: "seed-announcement" },
    update: { contentZh: "V1 演示环境已上线：无需注册即可体验下单、模拟支付与自动交付。", contentEn: "V1 demo is live: try checkout, mock payment and automatic delivery." },
    create: { id: "seed-announcement", titleZh: "上线公告", titleEn: "Launch", contentZh: "V1 演示环境已上线：无需注册即可体验下单、模拟支付与自动交付。", contentEn: "V1 demo is live: try checkout, mock payment and automatic delivery." },
  });

  const faqs = [
    ["如何查询订单？", "How do I find my order?", "下单后请保存订单号和随机查询凭证，在“查订单”页面输入两者即可。", "Save the order number and lookup token shown after checkout, then enter both on Order Lookup."],
    ["什么时候可以收到服务？", "When will delivery arrive?", "自动商品在支付确认后立即交付；人工商品以商品详情页标注的处理时间为准。", "Automatic products are delivered after payment. Manual products follow the processing time shown on the product page."],
    ["为什么不能只用订单号查询？", "Why is a token required?", "查询凭证用于保护交付内容，避免他人猜测订单号后查看你的数字商品。", "The token prevents others from guessing an order number and viewing your delivery."],
  ];
  for (let index = 0; index < faqs.length; index += 1) {
    const [questionZh, questionEn, answerZh, answerEn] = faqs[index];
    await prisma.faq.upsert({
      where: { id: `seed-faq-${index + 1}` },
      update: { questionZh, questionEn, answerZh, answerEn, sort: index },
      create: { id: `seed-faq-${index + 1}`, questionZh, questionEn, answerZh, answerEn, sort: index },
    });
  }

  const pages = [
    ["about", "关于我们", "About us", "灵搜AI致力于用清晰、简单的方式提供合规的 AI 数字服务。", "LingSou AI provides compliant AI digital services with a clear and simple experience."],
    ["refund", "退款政策", "Refund policy", "未交付订单可联系客服申请取消。数字内容一经成功交付，除内容无效或与描述不符外，不支持无理由退款。", "Undelivered orders may be cancelled through support. Delivered digital content is non-refundable unless invalid or materially different from its description."],
    ["privacy", "隐私政策", "Privacy policy", "我们仅收集完成订单与售后所需的邮箱、联系方式和交易信息，不出售个人数据。", "We collect only the email, contact and transaction data needed for orders and support. We do not sell personal data."],
    ["terms", "服务条款", "Terms of service", "购买即表示你同意商品页说明、交付方式与售后规则。请勿将服务用于违法或侵犯第三方权益的活动。", "By purchasing, you accept the product description, delivery method and support terms. Services must not be used unlawfully or to infringe third-party rights."],
  ];
  for (const [slug, titleZh, titleEn, contentZh, contentEn] of pages) {
    await prisma.contentPage.upsert({
      where: { slug },
      update: { titleZh, titleEn, contentZh, contentEn },
      create: { slug, titleZh, titleEn, contentZh, contentEn },
    });
  }

  const paymentSettings = {
    site_name: "灵搜AI",
    usdt_wallet_bep20: "0xDEMO0000000000000000000000000000BEP20",
    usdt_cny_rate: "7.00",
    payment_notice: "请按订单金额完成支付。电子收款码到账后由管理员人工核对；USDT 仅支持 BNB Smart Chain（BEP20）。",
  };
  for (const [key, value] of Object.entries(paymentSettings)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: key === "site_name" ? { value } : {},
      create: { key, value },
    });
  }

  console.log(`Seed complete. Admin: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
