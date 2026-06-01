/**
 * 生成应用图标
 * 使用方法：node scripts/generate-icons.js
 * 
 * 注意：需要准备一个 1024x1024 的 icon.png 放在 assets 目录
 * 此脚本会生成所有需要的尺寸
 */

const fs = require('fs');
const path = require('path');

// 检查源图标是否存在
const sourceIcon = path.join(__dirname, '..', 'assets', 'icon.png');

if (!fs.existsSync(sourceIcon)) {
  console.log('⚠️  请先准备一个 1024x1024 的 PNG 图标');
  console.log('   放置在: mobile/assets/icon.png');
  console.log('');
  console.log('📐 要求：');
  console.log('   - 尺寸：1024x1024 像素');
  console.log('   - 格式：PNG（支持透明背景）');
  console.log('   - 设计：简洁、易识别、符合 App Store 规范');
  console.log('');
  console.log('💡 提示：');
  console.log('   - 可以使用 Figma/Sketch/Canva 设计');
  console.log('   - 参考 Apple HIG: https://developer.apple.com/design/human-interface-guidelines/app-icons');
  process.exit(1);
}

console.log('✅ 图标文件已找到');
console.log('📱 接下来请手动更新以下文件：');
console.log('   1. assets/icon.png (1024x1024)');
console.log('   2. assets/adaptive-icon.png (1024x1024)');
console.log('   3. assets/splash-icon.png (建议 2048x2048)');
console.log('   4. assets/notification-icon.png (96x96)');
console.log('');
console.log('🎨 设计建议：');
console.log('   - 使用简洁的图标（避免过多细节）');
console.log('   - 考虑在白色和深色背景下的效果');
console.log('   - 测试缩小后的可读性（最小 16x16）');
