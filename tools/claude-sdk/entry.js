// Đưa SDK chính thức của Anthropic ra window để ai.js dùng trong WebView.
// Đóng gói lại: chạy "npm install" rồi "npm run build" trong thư mục này.
import Anthropic from '@anthropic-ai/sdk';
window.Anthropic = Anthropic;
