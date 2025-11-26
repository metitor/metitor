import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding enhanced sample data...\n');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.investment.deleteMany();
  await prisma.fundingRound.deleteMany();
  await prisma.acquisition.deleteMany();
  await prisma.office.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.iPO.deleteMany();
  await prisma.degree.deleteMany();
  await prisma.relationship.deleteMany();
  await prisma.object.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();
  console.log('✓ Cleaned existing data\n');

  // Create demo user with account (Better Auth stores password in Account)
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      name: 'Demo User',
      emailVerified: true,
      accounts: {
        create: {
          accountId: 'demo@example.com',
          providerId: 'credential',
          password: hashedPassword,
        },
      },
    },
  });
  console.log('✓ Created demo user:', user.email);

  // ========================================
  // COMPANIES
  // ========================================
  console.log('\n📦 Creating companies...');

  const companies = [
    {
      permalink: 'openai',
      name: 'OpenAI',
      normalizedName: 'openai',
      entityType: 'Company',
      categoryCode: 'artificial-intelligence',
      status: 'operating',
      foundedAt: new Date('2015-12-11'),
      description: 'OpenAI is an AI research and deployment company. Our mission is to ensure that artificial general intelligence benefits all of humanity. We create safe, beneficial AI systems including ChatGPT, GPT-4, and DALL-E.',
      homepageUrl: 'https://openai.com',
    },
    {
      permalink: 'anthropic',
      name: 'Anthropic',
      normalizedName: 'anthropic',
      entityType: 'Company',
      categoryCode: 'artificial-intelligence',
      status: 'operating',
      foundedAt: new Date('2021-01-01'),
      description: 'Anthropic is an AI safety company building reliable, interpretable, and steerable AI systems. Creator of Claude, an AI assistant designed to be helpful, harmless, and honest.',
      homepageUrl: 'https://anthropic.com',
    },
    {
      permalink: 'stripe',
      name: 'Stripe',
      normalizedName: 'stripe',
      entityType: 'Company',
      categoryCode: 'fintech',
      status: 'operating',
      foundedAt: new Date('2010-01-01'),
      description: 'Stripe is a technology company that builds economic infrastructure for the internet. Businesses of every size use Stripe\'s software and APIs to accept payments, send payouts, and manage their businesses online.',
      homepageUrl: 'https://stripe.com',
    },
    {
      permalink: 'figma',
      name: 'Figma',
      normalizedName: 'figma',
      entityType: 'Company',
      categoryCode: 'design',
      status: 'acquired',
      foundedAt: new Date('2012-01-01'),
      description: 'Figma is a collaborative interface design tool. It enables design teams to create, test, and ship better designs from start to finish.',
      homepageUrl: 'https://figma.com',
    },
    {
      permalink: 'notion',
      name: 'Notion',
      normalizedName: 'notion',
      entityType: 'Company',
      categoryCode: 'productivity',
      status: 'operating',
      foundedAt: new Date('2013-01-01'),
      description: 'Notion is the connected workspace where better, faster work happens. It combines notes, docs, wikis, project management, and collaboration tools in one space.',
      homepageUrl: 'https://notion.so',
    },
    {
      permalink: 'discord',
      name: 'Discord',
      normalizedName: 'discord',
      entityType: 'Company',
      categoryCode: 'social',
      status: 'operating',
      foundedAt: new Date('2015-05-13'),
      description: 'Discord is a voice, video, and text communication platform. Originally designed for gamers, it has become a popular platform for communities of all kinds.',
      homepageUrl: 'https://discord.com',
    },
    {
      permalink: 'vercel',
      name: 'Vercel',
      normalizedName: 'vercel',
      entityType: 'Company',
      categoryCode: 'developer-tools',
      status: 'operating',
      foundedAt: new Date('2015-11-01'),
      description: 'Vercel is the platform for frontend developers, providing the speed and reliability innovators need to create at the moment of inspiration. Creators of Next.js.',
      homepageUrl: 'https://vercel.com',
    },
    {
      permalink: 'databricks',
      name: 'Databricks',
      normalizedName: 'databricks',
      entityType: 'Company',
      categoryCode: 'data-analytics',
      status: 'operating',
      foundedAt: new Date('2013-06-01'),
      description: 'Databricks is the data and AI company. It provides a unified analytics platform for data engineering, data science, and machine learning.',
      homepageUrl: 'https://databricks.com',
    },
    {
      permalink: 'canva',
      name: 'Canva',
      normalizedName: 'canva',
      entityType: 'Company',
      categoryCode: 'design',
      status: 'operating',
      foundedAt: new Date('2012-01-01'),
      description: 'Canva is a graphic design platform that makes creating professional designs simple for everyone. Used by millions of users worldwide for social media graphics, presentations, and more.',
      homepageUrl: 'https://canva.com',
    },
    {
      permalink: 'plaid',
      name: 'Plaid',
      normalizedName: 'plaid',
      entityType: 'Company',
      categoryCode: 'fintech',
      status: 'operating',
      foundedAt: new Date('2013-05-01'),
      description: 'Plaid is a financial technology company that builds a data network powering the fintech and digital finance products that people use to improve their financial lives.',
      homepageUrl: 'https://plaid.com',
    },
    {
      permalink: 'airtable',
      name: 'Airtable',
      normalizedName: 'airtable',
      entityType: 'Company',
      categoryCode: 'productivity',
      status: 'operating',
      foundedAt: new Date('2012-01-01'),
      description: 'Airtable is a low-code platform for building collaborative apps. It combines the power of a database with the simplicity of a spreadsheet.',
      homepageUrl: 'https://airtable.com',
    },
    {
      permalink: 'linear',
      name: 'Linear',
      normalizedName: 'linear',
      entityType: 'Company',
      categoryCode: 'developer-tools',
      status: 'operating',
      foundedAt: new Date('2019-01-01'),
      description: 'Linear is a streamlined project and issue tracking tool built for modern software teams. It focuses on speed and simplicity.',
      homepageUrl: 'https://linear.app',
    },
    {
      permalink: 'supabase',
      name: 'Supabase',
      normalizedName: 'supabase',
      entityType: 'Company',
      categoryCode: 'developer-tools',
      status: 'operating',
      foundedAt: new Date('2020-01-01'),
      description: 'Supabase is an open source Firebase alternative. It provides all the backend services you need to build a product - database, authentication, storage, and real-time subscriptions.',
      homepageUrl: 'https://supabase.com',
    },
    {
      permalink: 'hugging-face',
      name: 'Hugging Face',
      normalizedName: 'hugging-face',
      entityType: 'Company',
      categoryCode: 'artificial-intelligence',
      status: 'operating',
      foundedAt: new Date('2016-01-01'),
      description: 'Hugging Face is the AI community building the future. The platform where the machine learning community collaborates on models, datasets, and applications.',
      homepageUrl: 'https://huggingface.co',
    },
    {
      permalink: 'retool',
      name: 'Retool',
      normalizedName: 'retool',
      entityType: 'Company',
      categoryCode: 'developer-tools',
      status: 'operating',
      foundedAt: new Date('2017-01-01'),
      description: 'Retool is the fastest way to build internal tools. It provides building blocks to quickly create custom business software.',
      homepageUrl: 'https://retool.com',
    },
    {
      permalink: 'scale-ai',
      name: 'Scale AI',
      normalizedName: 'scale-ai',
      entityType: 'Company',
      categoryCode: 'artificial-intelligence',
      status: 'operating',
      foundedAt: new Date('2016-07-01'),
      description: 'Scale AI provides high quality training and validation data for AI applications. It powers the most ambitious AI projects in the world.',
      homepageUrl: 'https://scale.com',
    },
    {
      permalink: 'instacart',
      name: 'Instacart',
      normalizedName: 'instacart',
      entityType: 'Company',
      categoryCode: 'e-commerce',
      status: 'operating',
      foundedAt: new Date('2012-06-01'),
      description: 'Instacart is a grocery technology company that provides same-day delivery and pickup service in the United States and Canada via a website and mobile app.',
      homepageUrl: 'https://instacart.com',
    },
    {
      permalink: 'ramp',
      name: 'Ramp',
      normalizedName: 'ramp',
      entityType: 'Company',
      categoryCode: 'fintech',
      status: 'operating',
      foundedAt: new Date('2019-03-01'),
      description: 'Ramp is the corporate card and spend management platform designed to help businesses save time and money. It\'s the fastest-growing corporate card in America.',
      homepageUrl: 'https://ramp.com',
    },
    {
      permalink: 'mongodb',
      name: 'MongoDB',
      normalizedName: 'mongodb',
      entityType: 'Company',
      categoryCode: 'database',
      status: 'ipo',
      foundedAt: new Date('2007-10-01'),
      description: 'MongoDB is a general purpose, document-based, distributed database built for modern application developers and for the cloud era.',
      homepageUrl: 'https://mongodb.com',
    },
    {
      permalink: 'shopify',
      name: 'Shopify',
      normalizedName: 'shopify',
      entityType: 'Company',
      categoryCode: 'e-commerce',
      status: 'ipo',
      foundedAt: new Date('2006-06-01'),
      description: 'Shopify is a complete commerce platform that lets you start, grow, and manage a business. It powers millions of businesses worldwide.',
      homepageUrl: 'https://shopify.com',
    },
  ];

  const companyMap = new Map<string, string>();
  
  for (const company of companies) {
    const created = await prisma.object.create({ data: company });
    companyMap.set(company.permalink, created.id);
    console.log('  ✓', company.name);
  }

  // ========================================
  // INVESTORS
  // ========================================
  console.log('\n💰 Creating investors...');

  const investors = [
    {
      permalink: 'sequoia-capital',
      name: 'Sequoia Capital',
      normalizedName: 'sequoia-capital',
      entityType: 'FinancialOrg',
      categoryCode: 'venture-capital',
      status: 'operating',
      foundedAt: new Date('1972-01-01'),
      description: 'Sequoia Capital is an American venture capital firm. The firm is located in Menlo Park, California and invests in both seed stage and growth stage companies.',
      homepageUrl: 'https://sequoiacap.com',
    },
    {
      permalink: 'andreessen-horowitz',
      name: 'Andreessen Horowitz',
      normalizedName: 'andreessen-horowitz',
      entityType: 'FinancialOrg',
      categoryCode: 'venture-capital',
      status: 'operating',
      foundedAt: new Date('2009-07-06'),
      description: 'Andreessen Horowitz (a16z) is a private American venture capital firm. It backs bold entrepreneurs building the future through technology.',
      homepageUrl: 'https://a16z.com',
    },
    {
      permalink: 'accel',
      name: 'Accel',
      normalizedName: 'accel',
      entityType: 'FinancialOrg',
      categoryCode: 'venture-capital',
      status: 'operating',
      foundedAt: new Date('1983-01-01'),
      description: 'Accel is a leading global venture capital firm. It partners with exceptional founders to build iconic companies.',
      homepageUrl: 'https://accel.com',
    },
    {
      permalink: 'tiger-global',
      name: 'Tiger Global Management',
      normalizedName: 'tiger-global',
      entityType: 'FinancialOrg',
      categoryCode: 'hedge-fund',
      status: 'operating',
      foundedAt: new Date('2001-01-01'),
      description: 'Tiger Global Management is an investment firm that focuses on public and private companies in the internet, software, and financial technology industries.',
      homepageUrl: 'https://tigerglobal.com',
    },
    {
      permalink: 'softbank-vision-fund',
      name: 'SoftBank Vision Fund',
      normalizedName: 'softbank-vision-fund',
      entityType: 'FinancialOrg',
      categoryCode: 'venture-capital',
      status: 'operating',
      foundedAt: new Date('2017-05-20'),
      description: 'SoftBank Vision Fund is the world\'s largest technology-focused venture capital fund. It invests in companies driving the AI revolution.',
      homepageUrl: 'https://visionfund.com',
    },
    {
      permalink: 'index-ventures',
      name: 'Index Ventures',
      normalizedName: 'index-ventures',
      entityType: 'FinancialOrg',
      categoryCode: 'venture-capital',
      status: 'operating',
      foundedAt: new Date('1996-01-01'),
      description: 'Index Ventures is an international venture capital firm. It has backed some of the most transformational entrepreneurs in tech.',
      homepageUrl: 'https://indexventures.com',
    },
    {
      permalink: 'greylock',
      name: 'Greylock Partners',
      normalizedName: 'greylock',
      entityType: 'FinancialOrg',
      categoryCode: 'venture-capital',
      status: 'operating',
      foundedAt: new Date('1965-01-01'),
      description: 'Greylock is one of the oldest venture capital firms in Silicon Valley. It focuses on early-stage investments in consumer, enterprise, and infrastructure companies.',
      homepageUrl: 'https://greylock.com',
    },
    {
      permalink: 'benchmark',
      name: 'Benchmark',
      normalizedName: 'benchmark',
      entityType: 'FinancialOrg',
      categoryCode: 'venture-capital',
      status: 'operating',
      foundedAt: new Date('1995-01-01'),
      description: 'Benchmark is a venture capital firm focused on early-stage investments. Known for backing eBay, Twitter, Uber, and other iconic companies.',
      homepageUrl: 'https://benchmark.com',
    },
    {
      permalink: 'kleiner-perkins',
      name: 'Kleiner Perkins',
      normalizedName: 'kleiner-perkins',
      entityType: 'FinancialOrg',
      categoryCode: 'venture-capital',
      status: 'operating',
      foundedAt: new Date('1972-01-01'),
      description: 'Kleiner Perkins is an American venture capital firm. It has backed Amazon, Google, Twitter, and many other transformational companies.',
      homepageUrl: 'https://kleinerperkins.com',
    },
    {
      permalink: 'lightspeed',
      name: 'Lightspeed Venture Partners',
      normalizedName: 'lightspeed',
      entityType: 'FinancialOrg',
      categoryCode: 'venture-capital',
      status: 'operating',
      foundedAt: new Date('2000-01-01'),
      description: 'Lightspeed is a multi-stage venture capital firm focused on accelerating disruptive innovations and trends in the enterprise and consumer sectors.',
      homepageUrl: 'https://lsvp.com',
    },
    {
      permalink: 'founders-fund',
      name: 'Founders Fund',
      normalizedName: 'founders-fund',
      entityType: 'FinancialOrg',
      categoryCode: 'venture-capital',
      status: 'operating',
      foundedAt: new Date('2005-01-01'),
      description: 'Founders Fund is a San Francisco-based venture capital firm. It invests in companies building revolutionary technologies.',
      homepageUrl: 'https://foundersfund.com',
    },
    {
      permalink: 'general-catalyst',
      name: 'General Catalyst',
      normalizedName: 'general-catalyst',
      entityType: 'FinancialOrg',
      categoryCode: 'venture-capital',
      status: 'operating',
      foundedAt: new Date('2000-01-01'),
      description: 'General Catalyst is a venture capital firm that invests in powerful, positive change that endures—for our entrepreneurs, our investors, and society.',
      homepageUrl: 'https://generalcatalyst.com',
    },
  ];

  const investorMap = new Map<string, string>();
  
  for (const investor of investors) {
    const created = await prisma.object.create({ data: investor });
    investorMap.set(investor.permalink, created.id);
    console.log('  ✓', investor.name);
  }

  // ========================================
  // FUNDING ROUNDS
  // ========================================
  console.log('\n📈 Creating funding rounds and investments...');

  const fundingData = [
    // OpenAI
    { company: 'openai', round: 'seed', amount: 1000000, date: '2015-12-11', investors: ['founders-fund'] },
    { company: 'openai', round: 'series-a', amount: 130000000, date: '2019-07-22', investors: ['founders-fund'] },
    { company: 'openai', round: 'series-b', amount: 1000000000, date: '2021-01-01', investors: ['tiger-global'] },
    { company: 'openai', round: 'series-c', amount: 10000000000, date: '2023-01-23', investors: ['tiger-global', 'sequoia-capital'] },
    
    // Anthropic
    { company: 'anthropic', round: 'seed', amount: 124000000, date: '2021-05-01', investors: ['general-catalyst'] },
    { company: 'anthropic', round: 'series-a', amount: 580000000, date: '2022-04-01', investors: ['general-catalyst', 'lightspeed'] },
    { company: 'anthropic', round: 'series-b', amount: 450000000, date: '2023-02-01', investors: ['general-catalyst'] },
    { company: 'anthropic', round: 'series-c', amount: 2000000000, date: '2023-09-25', investors: ['general-catalyst'] },
    
    // Stripe
    { company: 'stripe', round: 'seed', amount: 2000000, date: '2011-03-01', investors: ['sequoia-capital'] },
    { company: 'stripe', round: 'series-a', amount: 18000000, date: '2012-02-01', investors: ['sequoia-capital'] },
    { company: 'stripe', round: 'series-b', amount: 80000000, date: '2014-01-22', investors: ['sequoia-capital', 'founders-fund'] },
    { company: 'stripe', round: 'series-c', amount: 150000000, date: '2016-11-25', investors: ['sequoia-capital', 'general-catalyst'] },
    { company: 'stripe', round: 'series-d', amount: 245000000, date: '2018-09-26', investors: ['tiger-global', 'sequoia-capital'] },
    { company: 'stripe', round: 'series-e', amount: 850000000, date: '2019-09-19', investors: ['sequoia-capital', 'andreessen-horowitz', 'general-catalyst'] },
    { company: 'stripe', round: 'series-g', amount: 600000000, date: '2021-03-14', investors: ['sequoia-capital', 'andreessen-horowitz'] },
    { company: 'stripe', round: 'series-h', amount: 6500000000, date: '2023-03-15', investors: ['sequoia-capital', 'andreessen-horowitz', 'founders-fund', 'general-catalyst'] },
    
    // Figma
    { company: 'figma', round: 'seed', amount: 3800000, date: '2013-06-01', investors: ['index-ventures', 'greylock'] },
    { company: 'figma', round: 'series-a', amount: 14000000, date: '2015-12-01', investors: ['index-ventures', 'greylock'] },
    { company: 'figma', round: 'series-b', amount: 25000000, date: '2018-02-01', investors: ['index-ventures', 'greylock', 'kleiner-perkins'] },
    { company: 'figma', round: 'series-c', amount: 40000000, date: '2019-06-26', investors: ['sequoia-capital', 'andreessen-horowitz', 'kleiner-perkins'] },
    { company: 'figma', round: 'series-d', amount: 50000000, date: '2020-04-30', investors: ['andreessen-horowitz', 'sequoia-capital'] },
    { company: 'figma', round: 'series-e', amount: 200000000, date: '2021-06-24', investors: ['andreessen-horowitz', 'sequoia-capital'] },
    
    // Notion
    { company: 'notion', round: 'seed', amount: 2000000, date: '2016-08-01', investors: ['index-ventures'] },
    { company: 'notion', round: 'series-a', amount: 10000000, date: '2019-07-09', investors: ['index-ventures'] },
    { company: 'notion', round: 'series-b', amount: 50000000, date: '2020-04-01', investors: ['index-ventures'] },
    { company: 'notion', round: 'series-c', amount: 275000000, date: '2021-10-08', investors: ['sequoia-capital', 'index-ventures'] },
    
    // Discord
    { company: 'discord', round: 'seed', amount: 5000000, date: '2015-02-01', investors: ['benchmark', 'greylock'] },
    { company: 'discord', round: 'series-a', amount: 20000000, date: '2016-01-12', investors: ['greylock', 'benchmark'] },
    { company: 'discord', round: 'series-b', amount: 50000000, date: '2017-04-05', investors: ['greylock', 'index-ventures'] },
    { company: 'discord', round: 'series-c', amount: 130000000, date: '2018-12-21', investors: ['greylock', 'index-ventures'] },
    { company: 'discord', round: 'series-d', amount: 150000000, date: '2020-06-30', investors: ['greylock', 'index-ventures'] },
    { company: 'discord', round: 'series-e', amount: 100000000, date: '2020-12-17', investors: ['greylock', 'index-ventures'] },
    { company: 'discord', round: 'series-f', amount: 500000000, date: '2021-09-15', investors: ['greylock', 'index-ventures', 'softbank-vision-fund'] },
    
    // Vercel
    { company: 'vercel', round: 'seed', amount: 8000000, date: '2016-08-01', investors: ['accel'] },
    { company: 'vercel', round: 'series-a', amount: 21000000, date: '2020-04-21', investors: ['accel'] },
    { company: 'vercel', round: 'series-b', amount: 40000000, date: '2020-12-16', investors: ['accel', 'greylock'] },
    { company: 'vercel', round: 'series-c', amount: 102000000, date: '2021-06-23', investors: ['accel', 'greylock', 'softbank-vision-fund'] },
    { company: 'vercel', round: 'series-d', amount: 150000000, date: '2022-05-25', investors: ['accel', 'greylock'] },
    
    // Databricks
    { company: 'databricks', round: 'series-a', amount: 14000000, date: '2013-09-01', investors: ['andreessen-horowitz'] },
    { company: 'databricks', round: 'series-b', amount: 33000000, date: '2014-12-01', investors: ['andreessen-horowitz'] },
    { company: 'databricks', round: 'series-c', amount: 60000000, date: '2016-12-14', investors: ['andreessen-horowitz'] },
    { company: 'databricks', round: 'series-d', amount: 140000000, date: '2017-08-22', investors: ['andreessen-horowitz'] },
    { company: 'databricks', round: 'series-e', amount: 250000000, date: '2019-02-05', investors: ['andreessen-horowitz'] },
    { company: 'databricks', round: 'series-f', amount: 400000000, date: '2019-10-22', investors: ['andreessen-horowitz'] },
    { company: 'databricks', round: 'series-g', amount: 1000000000, date: '2021-02-01', investors: ['andreessen-horowitz'] },
    { company: 'databricks', round: 'series-h', amount: 1600000000, date: '2021-08-31', investors: ['andreessen-horowitz', 'tiger-global'] },
    { company: 'databricks', round: 'series-i', amount: 500000000, date: '2023-09-14', investors: ['andreessen-horowitz'] },
    
    // Canva
    { company: 'canva', round: 'seed', amount: 3000000, date: '2013-03-01', investors: ['index-ventures'] },
    { company: 'canva', round: 'series-a', amount: 15000000, date: '2015-01-01', investors: ['index-ventures', 'sequoia-capital'] },
    { company: 'canva', round: 'series-b', amount: 40000000, date: '2018-01-08', investors: ['sequoia-capital'] },
    { company: 'canva', round: 'series-c', amount: 85000000, date: '2019-10-17', investors: ['sequoia-capital', 'general-catalyst'] },
    { company: 'canva', round: 'series-d', amount: 200000000, date: '2021-04-14', investors: ['sequoia-capital', 'softbank-vision-fund'] },
    { company: 'canva', round: 'series-e', amount: 200000000, date: '2021-09-15', investors: ['sequoia-capital', 'softbank-vision-fund'] },
    
    // Plaid
    { company: 'plaid', round: 'seed', amount: 2800000, date: '2013-09-01', investors: ['kleiner-perkins'] },
    { company: 'plaid', round: 'series-a', amount: 12500000, date: '2014-12-02', investors: ['kleiner-perkins', 'index-ventures'] },
    { company: 'plaid', round: 'series-b', amount: 44000000, date: '2016-06-08', investors: ['kleiner-perkins', 'index-ventures'] },
    { company: 'plaid', round: 'series-c', amount: 250000000, date: '2018-12-11', investors: ['kleiner-perkins', 'index-ventures'] },
    { company: 'plaid', round: 'series-d', amount: 425000000, date: '2021-04-07', investors: ['kleiner-perkins', 'index-ventures', 'softbank-vision-fund'] },
    
    // Airtable
    { company: 'airtable', round: 'seed', amount: 3000000, date: '2013-09-01', investors: ['accel'] },
    { company: 'airtable', round: 'series-a', amount: 7700000, date: '2015-03-06', investors: ['accel'] },
    { company: 'airtable', round: 'series-b', amount: 52000000, date: '2018-03-15', investors: ['accel', 'benchmark'] },
    { company: 'airtable', round: 'series-c', amount: 100000000, date: '2018-11-15', investors: ['accel', 'benchmark'] },
    { company: 'airtable', round: 'series-d', amount: 185000000, date: '2020-09-14', investors: ['accel', 'benchmark', 'tiger-global'] },
    { company: 'airtable', round: 'series-e', amount: 270000000, date: '2021-03-15', investors: ['accel', 'tiger-global'] },
    { company: 'airtable', round: 'series-f', amount: 735000000, date: '2021-12-13', investors: ['accel', 'tiger-global', 'softbank-vision-fund'] },
    
    // Linear
    { company: 'linear', round: 'seed', amount: 4200000, date: '2019-11-01', investors: ['sequoia-capital'] },
    { company: 'linear', round: 'series-a', amount: 13000000, date: '2020-12-10', investors: ['sequoia-capital', 'accel'] },
    { company: 'linear', round: 'series-b', amount: 35000000, date: '2021-06-23', investors: ['sequoia-capital', 'accel'] },
    { company: 'linear', round: 'series-c', amount: 35000000, date: '2024-02-29', investors: ['sequoia-capital', 'accel'] },
    
    // Supabase
    { company: 'supabase', round: 'seed', amount: 6000000, date: '2020-12-01', investors: ['founders-fund'] },
    { company: 'supabase', round: 'series-a', amount: 30000000, date: '2021-09-09', investors: ['founders-fund'] },
    { company: 'supabase', round: 'series-b', amount: 80000000, date: '2022-05-10', investors: ['founders-fund', 'lightspeed'] },
    { company: 'supabase', round: 'series-c', amount: 116000000, date: '2024-04-25', investors: ['founders-fund', 'lightspeed', 'greylock'] },
    
    // Hugging Face
    { company: 'hugging-face', round: 'seed', amount: 2400000, date: '2017-10-01', investors: ['lightspeed'] },
    { company: 'hugging-face', round: 'series-a', amount: 15000000, date: '2019-12-17', investors: ['lightspeed'] },
    { company: 'hugging-face', round: 'series-b', amount: 40000000, date: '2021-03-11', investors: ['lightspeed', 'sequoia-capital'] },
    { company: 'hugging-face', round: 'series-c', amount: 100000000, date: '2022-05-05', investors: ['lightspeed', 'sequoia-capital'] },
    { company: 'hugging-face', round: 'series-d', amount: 235000000, date: '2023-08-24', investors: ['lightspeed', 'sequoia-capital', 'andreessen-horowitz'] },
    
    // Retool
    { company: 'retool', round: 'seed', amount: 2100000, date: '2017-07-01', investors: ['sequoia-capital'] },
    { company: 'retool', round: 'series-a', amount: 21000000, date: '2019-10-02', investors: ['sequoia-capital'] },
    { company: 'retool', round: 'series-b', amount: 50000000, date: '2020-10-28', investors: ['sequoia-capital'] },
    { company: 'retool', round: 'series-c', amount: 200000000, date: '2022-04-12', investors: ['sequoia-capital', 'andreessen-horowitz'] },
    
    // Scale AI
    { company: 'scale-ai', round: 'seed', amount: 4500000, date: '2016-08-01', investors: ['accel'] },
    { company: 'scale-ai', round: 'series-a', amount: 18000000, date: '2017-08-24', investors: ['accel'] },
    { company: 'scale-ai', round: 'series-b', amount: 100000000, date: '2019-08-05', investors: ['accel', 'founders-fund'] },
    { company: 'scale-ai', round: 'series-c', amount: 155000000, date: '2020-05-05', investors: ['accel', 'founders-fund', 'tiger-global'] },
    { company: 'scale-ai', round: 'series-d', amount: 325000000, date: '2021-04-13', investors: ['accel', 'founders-fund', 'tiger-global'] },
    { company: 'scale-ai', round: 'series-e', amount: 1000000000, date: '2022-02-16', investors: ['accel', 'founders-fund', 'tiger-global'] },
    
    // Instacart
    { company: 'instacart', round: 'seed', amount: 2300000, date: '2012-10-01', investors: ['sequoia-capital'] },
    { company: 'instacart', round: 'series-a', amount: 8500000, date: '2013-09-04', investors: ['sequoia-capital'] },
    { company: 'instacart', round: 'series-b', amount: 44000000, date: '2014-06-26', investors: ['sequoia-capital', 'andreessen-horowitz'] },
    { company: 'instacart', round: 'series-c', amount: 220000000, date: '2015-01-08', investors: ['sequoia-capital', 'andreessen-horowitz', 'kleiner-perkins'] },
    { company: 'instacart', round: 'series-d', amount: 400000000, date: '2017-03-07', investors: ['sequoia-capital', 'andreessen-horowitz'] },
    { company: 'instacart', round: 'series-e', amount: 600000000, date: '2018-10-30', investors: ['sequoia-capital'] },
    { company: 'instacart', round: 'series-f', amount: 871000000, date: '2021-03-02', investors: ['sequoia-capital', 'andreessen-horowitz'] },
    
    // Ramp
    { company: 'ramp', round: 'seed', amount: 7000000, date: '2019-03-01', investors: ['founders-fund'] },
    { company: 'ramp', round: 'series-a', amount: 25000000, date: '2020-08-31', investors: ['founders-fund'] },
    { company: 'ramp', round: 'series-b', amount: 115000000, date: '2021-04-15', investors: ['founders-fund', 'tiger-global'] },
    { company: 'ramp', round: 'series-c', amount: 300000000, date: '2021-08-30', investors: ['founders-fund', 'tiger-global', 'softbank-vision-fund'] },
    { company: 'ramp', round: 'series-d', amount: 750000000, date: '2023-03-28', investors: ['founders-fund', 'tiger-global', 'softbank-vision-fund'] },
    
    // MongoDB
    { company: 'mongodb', round: 'series-a', amount: 5000000, date: '2008-09-30', investors: ['sequoia-capital'] },
    { company: 'mongodb', round: 'series-b', amount: 20000000, date: '2011-03-17', investors: ['sequoia-capital'] },
    { company: 'mongodb', round: 'series-c', amount: 42000000, date: '2012-05-30', investors: ['sequoia-capital'] },
    { company: 'mongodb', round: 'series-d', amount: 150000000, date: '2013-10-04', investors: ['sequoia-capital'] },
    { company: 'mongodb', round: 'series-e', amount: 80000000, date: '2015-01-15', investors: ['sequoia-capital', 'tiger-global'] },
    
    // Shopify
    { company: 'shopify', round: 'seed', amount: 250000, date: '2006-06-01', investors: ['founders-fund'] },
    { company: 'shopify', round: 'series-a', amount: 7000000, date: '2010-12-07', investors: ['benchmark'] },
    { company: 'shopify', round: 'series-b', amount: 15000000, date: '2011-10-11', investors: ['benchmark'] },
    { company: 'shopify', round: 'series-c', amount: 100000000, date: '2013-12-04', investors: ['benchmark', 'tiger-global'] },
  ];

  for (const fund of fundingData) {
    const companyId = companyMap.get(fund.company);
    if (!companyId) continue;

    const fundingRound = await prisma.fundingRound.create({
      data: {
        objectId: companyId,
        roundCode: fund.round,
        raisedAmount: fund.amount,
        raisedCurrencyCode: 'USD',
        fundedAt: new Date(fund.date),
        participants: fund.investors.length,
      },
    });

    for (const investorPermalink of fund.investors) {
      const investorId = investorMap.get(investorPermalink);
      if (investorId) {
        await prisma.investment.create({
          data: {
            fundingRoundId: fundingRound.id,
            investorObjectId: investorId,
          },
        });
      }
    }
  }
  console.log('✓ Created', fundingData.length, 'funding rounds');

  // ========================================
  // OFFICES
  // ========================================
  console.log('\n🏢 Creating offices...');

  const offices = [
    { company: 'openai', description: 'Headquarters', city: 'San Francisco', stateCode: 'CA', countryCode: 'USA', address1: '3180 18th Street' },
    { company: 'anthropic', description: 'Headquarters', city: 'San Francisco', stateCode: 'CA', countryCode: 'USA', address1: '548 Market Street' },
    { company: 'stripe', description: 'Global Headquarters', city: 'San Francisco', stateCode: 'CA', countryCode: 'USA', address1: '354 Oyster Point Blvd' },
    { company: 'stripe', description: 'Dublin Office', city: 'Dublin', countryCode: 'IRL', address1: '1 Grand Canal Street Lower' },
    { company: 'stripe', description: 'Singapore Office', city: 'Singapore', countryCode: 'SGP', address1: '8 Marina Boulevard' },
    { company: 'figma', description: 'Headquarters', city: 'San Francisco', stateCode: 'CA', countryCode: 'USA', address1: '760 Market Street' },
    { company: 'notion', description: 'Headquarters', city: 'San Francisco', stateCode: 'CA', countryCode: 'USA', address1: '285 Hamilton Avenue' },
    { company: 'discord', description: 'Headquarters', city: 'San Francisco', stateCode: 'CA', countryCode: 'USA', address1: '444 De Haro Street' },
    { company: 'vercel', description: 'Headquarters', city: 'San Francisco', stateCode: 'CA', countryCode: 'USA', address1: '340 S Lemon Ave' },
    { company: 'databricks', description: 'Headquarters', city: 'San Francisco', stateCode: 'CA', countryCode: 'USA', address1: '160 Spear Street' },
    { company: 'databricks', description: 'Amsterdam Office', city: 'Amsterdam', countryCode: 'NLD', address1: 'Rokin 92' },
    { company: 'canva', description: 'Headquarters', city: 'Sydney', stateCode: 'NSW', countryCode: 'AUS', address1: '110 Kippax Street' },
    { company: 'plaid', description: 'Headquarters', city: 'San Francisco', stateCode: 'CA', countryCode: 'USA', address1: '564 Market Street' },
    { company: 'airtable', description: 'Headquarters', city: 'San Francisco', stateCode: 'CA', countryCode: 'USA', address1: '799 Market Street' },
    { company: 'linear', description: 'Headquarters', city: 'San Francisco', stateCode: 'CA', countryCode: 'USA' },
    { company: 'supabase', description: 'Remote-first', city: 'San Francisco', stateCode: 'CA', countryCode: 'USA' },
    { company: 'hugging-face', description: 'Headquarters', city: 'New York', stateCode: 'NY', countryCode: 'USA' },
    { company: 'hugging-face', description: 'Paris Office', city: 'Paris', countryCode: 'FRA' },
    { company: 'retool', description: 'Headquarters', city: 'San Francisco', stateCode: 'CA', countryCode: 'USA', address1: '1 Letterman Drive' },
    { company: 'scale-ai', description: 'Headquarters', city: 'San Francisco', stateCode: 'CA', countryCode: 'USA', address1: '3035 21st Street' },
    { company: 'instacart', description: 'Headquarters', city: 'San Francisco', stateCode: 'CA', countryCode: 'USA', address1: '50 Beale Street' },
    { company: 'ramp', description: 'Headquarters', city: 'New York', stateCode: 'NY', countryCode: 'USA', address1: '29 Little West 12th Street' },
    { company: 'mongodb', description: 'Headquarters', city: 'New York', stateCode: 'NY', countryCode: 'USA', address1: '1633 Broadway' },
    { company: 'shopify', description: 'Headquarters', city: 'Ottawa', stateCode: 'ON', countryCode: 'CAN', address1: '150 Elgin Street' },
    { company: 'shopify', description: 'Toronto Office', city: 'Toronto', stateCode: 'ON', countryCode: 'CAN' },
  ];

  for (const office of offices) {
    const companyId = companyMap.get(office.company);
    if (companyId) {
      await prisma.office.create({
        data: {
          objectId: companyId,
          description: office.description,
          city: office.city,
          stateCode: office.stateCode,
          countryCode: office.countryCode,
          address1: office.address1,
        },
      });
    }
  }
  console.log('✓ Created', offices.length, 'offices');

  // ========================================
  // MILESTONES
  // ========================================
  console.log('\n🎯 Creating milestones...');

  const milestones = [
    { company: 'openai', milestone: 'ChatGPT Launch', date: '2022-11-30', description: 'Launched ChatGPT, reaching 1 million users in 5 days' },
    { company: 'openai', milestone: 'GPT-4 Release', date: '2023-03-14', description: 'Released GPT-4, a large multimodal model' },
    { company: 'openai', milestone: 'DALL-E 2 Launch', date: '2022-04-06', description: 'Launched DALL-E 2, an AI image generation system' },
    { company: 'anthropic', milestone: 'Claude Launch', date: '2023-03-14', description: 'Publicly launched Claude, an AI assistant' },
    { company: 'anthropic', milestone: 'Claude 2 Release', date: '2023-07-11', description: 'Released Claude 2 with improved capabilities' },
    { company: 'anthropic', milestone: 'Claude 3 Release', date: '2024-03-04', description: 'Released Claude 3 family of models including Opus, Sonnet, and Haiku' },
    { company: 'stripe', milestone: 'Stripe Atlas Launch', date: '2016-02-24', description: 'Launched Stripe Atlas to help startups incorporate' },
    { company: 'stripe', milestone: 'Stripe Terminal Launch', date: '2018-09-17', description: 'Launched in-person payments with Stripe Terminal' },
    { company: 'stripe', milestone: 'Stripe Checkout Launch', date: '2019-04-09', description: 'Launched new Stripe Checkout for faster payments' },
    { company: 'figma', milestone: 'FigJam Launch', date: '2021-04-21', description: 'Launched FigJam for collaborative whiteboarding' },
    { company: 'figma', milestone: 'Adobe Acquisition Announced', date: '2022-09-15', description: 'Adobe announced acquisition of Figma for $20B' },
    { company: 'figma', milestone: 'Acquisition Terminated', date: '2023-12-18', description: 'Adobe and Figma mutually terminated merger agreement' },
    { company: 'notion', milestone: 'Notion AI Launch', date: '2023-02-22', description: 'Launched Notion AI for intelligent assistance' },
    { company: 'notion', milestone: '30M Users', date: '2023-01-01', description: 'Reached 30 million users milestone' },
    { company: 'discord', milestone: '100M Monthly Users', date: '2020-07-01', description: 'Reached 100 million monthly active users' },
    { company: 'discord', milestone: '150M Monthly Users', date: '2021-09-01', description: 'Reached 150 million monthly active users' },
    { company: 'vercel', milestone: 'Next.js 13 Launch', date: '2022-10-25', description: 'Released Next.js 13 with App Router' },
    { company: 'vercel', milestone: 'v0 Launch', date: '2023-09-01', description: 'Launched v0, an AI-powered UI generation tool' },
    { company: 'databricks', milestone: 'Unity Catalog Launch', date: '2022-06-28', description: 'Launched Unity Catalog for unified data governance' },
    { company: 'databricks', milestone: 'MosaicML Acquisition', date: '2023-06-26', description: 'Acquired MosaicML for $1.3B' },
    { company: 'canva', milestone: '100M Monthly Users', date: '2022-09-01', description: 'Reached 100 million monthly active users' },
    { company: 'canva', milestone: 'Magic Studio Launch', date: '2023-10-04', description: 'Launched Magic Studio with AI-powered design tools' },
    { company: 'supabase', milestone: 'Launch Week 8', date: '2023-08-07', description: 'Major product announcements during Launch Week 8' },
    { company: 'hugging-face', milestone: 'Open LLM Leaderboard', date: '2023-05-01', description: 'Launched the Open LLM Leaderboard' },
    { company: 'scale-ai', milestone: 'Defense Contract', date: '2024-02-01', description: 'Won $250M+ contract with US Department of Defense' },
    { company: 'mongodb', milestone: 'MongoDB 7.0 Release', date: '2023-08-15', description: 'Released MongoDB 7.0 with queryable encryption' },
    { company: 'shopify', milestone: 'Shop Pay Launch', date: '2020-04-28', description: 'Launched Shop Pay for accelerated checkout' },
    { company: 'instacart', milestone: 'IPO', date: '2023-09-19', description: 'Went public on NASDAQ at $30 per share' },
  ];

  for (const m of milestones) {
    const companyId = companyMap.get(m.company);
    if (companyId) {
      await prisma.milestone.create({
        data: {
          objectId: companyId,
          milestoneCode: m.milestone,
          milestoneAt: new Date(m.date),
          description: m.description,
        },
      });
    }
  }
  console.log('✓ Created', milestones.length, 'milestones');

  // ========================================
  // IPOS
  // ========================================
  console.log('\n🔔 Creating IPOs...');

  const ipos = [
    { company: 'mongodb', date: '2017-10-19', valuation: 1300000000, raised: 192000000, symbol: 'MDB' },
    { company: 'shopify', date: '2015-05-21', valuation: 1270000000, raised: 131000000, symbol: 'SHOP' },
    { company: 'instacart', date: '2023-09-19', valuation: 10000000000, raised: 660000000, symbol: 'CART' },
  ];

  for (const ipo of ipos) {
    const companyId = companyMap.get(ipo.company);
    if (companyId) {
      await prisma.iPO.create({
        data: {
          objectId: companyId,
          publicAt: new Date(ipo.date),
          valuationAmount: ipo.valuation,
          valuationCurrencyCode: 'USD',
          raisedAmount: ipo.raised,
          raisedCurrencyCode: 'USD',
          stockSymbol: ipo.symbol,
        },
      });
    }
  }
  console.log('✓ Created', ipos.length, 'IPOs');

  // ========================================
  // ACQUISITIONS
  // ========================================
  console.log('\n🤝 Creating acquisitions...');

  // For Figma, we need to create Adobe as an acquirer
  const adobe = await prisma.object.create({
    data: {
      permalink: 'adobe',
      name: 'Adobe Inc.',
      normalizedName: 'adobe',
      entityType: 'Company',
      categoryCode: 'software',
      status: 'ipo',
      foundedAt: new Date('1982-12-01'),
      description: 'Adobe is a software company that creates multimedia and creativity software products.',
      homepageUrl: 'https://adobe.com',
    },
  });
  companyMap.set('adobe', adobe.id);
  console.log('  ✓ Created Adobe as acquirer');

  // Note: Figma acquisition was terminated, but we can include it as a historical event
  // Let's add some other acquisitions instead
  const acquisitions = [
    { acquired: 'figma', acquiring: 'adobe', date: '2022-09-15', price: 20000000000, status: 'terminated' },
  ];

  for (const acq of acquisitions) {
    const acquiredId = companyMap.get(acq.acquired);
    const acquiringId = companyMap.get(acq.acquiring);
    if (acquiredId && acquiringId) {
      await prisma.acquisition.create({
        data: {
          acquiredObjectId: acquiredId,
          acquiringObjectId: acquiringId,
          acquiredAt: new Date(acq.date),
          priceAmount: acq.price,
          priceCurrencyCode: 'USD',
          termCode: acq.status,
        },
      });
    }
  }
  console.log('✓ Created acquisitions');

  // ========================================
  // PLUGIN INSTALLATIONS
  // ========================================
  console.log('\n🔌 Installing plugins for demo user...');

  // Clean existing plugin data
  await prisma.entityPluginConfig.deleteMany();
  await prisma.pluginInstallation.deleteMany();

  // Install both plugins for the demo user
  const pluginInstallations = [
    {
      userId: user.id,
      pluginId: 'company-metrics',
      enabled: true,
      settings: {},
    },
    {
      userId: user.id,
      pluginId: 'investor-insights',
      enabled: true,
      settings: {},
    },
  ];

  for (const plugin of pluginInstallations) {
    await prisma.pluginInstallation.create({ data: plugin });
    console.log(`  ✓ Installed plugin: ${plugin.pluginId}`);
  }

  console.log('✓ Installed', pluginInstallations.length, 'plugins for demo user');

  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n========================================');
  console.log('✅ Enhanced seed data created successfully!');
  console.log('========================================');
  console.log(`📊 Summary:`);
  console.log(`   - ${companies.length + 1} companies`);
  console.log(`   - ${investors.length} investors`);
  console.log(`   - ${fundingData.length} funding rounds`);
  console.log(`   - ${offices.length} offices`);
  console.log(`   - ${milestones.length} milestones`);
  console.log(`   - ${ipos.length} IPOs`);
  console.log(`   - ${acquisitions.length} acquisitions`);
  console.log(`   - ${pluginInstallations.length} plugin installations`);
  console.log('\n🔑 Demo credentials:');
  console.log('   Email: demo@example.com');
  console.log('   Password: password123');
  console.log('\n🔌 Installed plugins:');
  console.log('   - company-metrics (Company Metrics)');
  console.log('   - investor-insights (Investor Insights)');
  console.log('\n💡 Login with demo credentials to see plugins in action!');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
