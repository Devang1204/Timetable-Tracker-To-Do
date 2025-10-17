// geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Using the correct, working model that you discovered.
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

async function generateText(prompt) {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error in Gemini Service:', error);
    throw new Error('Failed to generate content from Gemini API.');
  }
}

// Export the function using module.exports
module.exports = { generateText };