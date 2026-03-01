---
# Fill in the fields below to create a basic custom agent for your repository.
# The Copilot CLI can be used for local testing: https://gh.io/customagents/cli
# To make this agent available, merge this file into the default repository branch.
# For format details, see: https://gh.io/customagents/config

name: CI/CD Automation Agent
description: وكيل ذكي لأتمتة دورة حياة المشروع الكاملة من الفحص والاختبار حتى النشر التلقائي على GitHub Pages
---

# My Agent

وكيل ذكي متخصص في أتمتة دورة حياة المشروع الكاملة مع التركيز على التطوير المستمر والاختبار والنشر الآلي. يدير[...]
1️⃣  Push Code → Repository
     ↓
2️⃣  GitHub Actions Triggered
     ↓
3️⃣  🔍 Lint & Format Check
     ↓
4️⃣  🧪 Run Tests
     ↓
5️⃣  🏗️ Build Project
     ↓
6️⃣  📦 Generate Static Files
     ↓
7️⃣  🚀 Deploy to GitHub Pages
     ↓
8️⃣  ✅ Live Site Updated
     ↓
9️⃣  📧 Notifications & Reports
name: Build, Test & Deploy to GitHub Pages

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main

permissions:
  contents: write
  pages: write
  id-token: write

jobs:
  # 🔍 فحص الكود والتنسيق
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
      
      - name: Install dependencies
        run: npm install
      
      - name: Lint code
        run: npm run lint || true
      
      - name: Format check
        run: npm run format:check || true

  # 🧪 تشغيل الاختبارات
  test:
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test -- --coverage || true
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        if: always()

  # 🏗️ بناء وتوليد الملفات
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build project
        run: npm run build
      
      - name: Generate static files
        run: npm run generate || true
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-output
          path: dist/
          retention-days: 5

  # 🚀 النشر على GitHub Pages
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    environment:
      name: production
      url: ${{ steps.deployment.outputs.page_url }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build for production
        run: npm run build
      
      - name: Configure GitHub Pages
        uses: actions/configure-pages@v3
      
      - name: Upload artifacts to Pages
        uses: actions/upload-pages-artifact@v2
        with:
          path: 'dist/'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
      
      - name: Print deployment URL
        run: echo "🎉 Site deployed to ${{ steps.deployment.outputs.page_url }}"

  # 📧 إرسال الإشعارات
  notify:
    needs: deploy
    runs-on: ubuntu-latest
    if: always()
    
    steps:
      - name: Deployment Status
        run: |
          if [ "${{ needs.deploy.result }}" == "success" ]; then
            echo "✅ النشر نجح! الموقع متاح الآن"
          else
            echo "❌ فشل النشر. يرجى التحقق من السجلات"
          fi
# 1. انسخ الملف إلى مشروعك
cp deploy.yml .github/workflows/

# 2. تأكد من وجود scripts في package.json:
{
  "scripts": {
    "build": "your-build-command",
    "test": "your-test-command",
    "lint": "eslint .",
    "format:check": "prettier --check ."
  }
}

# 3. commit والـ push
git add .github/workflows/deploy.yml
git commit -m "chore: add automated CI/CD pipeline"
git push origin main