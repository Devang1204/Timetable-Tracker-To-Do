// test-gemini.js
import { generateText } from './geminiService.js';

console.log("Attempting to call the Gemini API...");

generateText("Say 'Hello, World!'")
  .then(text => {
    console.log("✅ Success! Gemini API responded:", text);
  })
  .catch(err => {
    console.error("❌ Error calling Gemini API:", err);
  });