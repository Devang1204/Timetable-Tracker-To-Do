// geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

// Generic text generation
async function generateText(prompt) {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error in Gemini Service (generateText):', error);
    throw new Error('Failed to generate content from Gemini API.');
  }
}

// Student timetable parsing from text
async function generateTimetableFromText(extractedText) {
  const prompt = `
    Analyze the following raw text extracted from a university timetable. Your task is to convert it into a structured JSON array of objects. Each object must represent a single class session and have these keys: "subject", "day", "start_time", "end_time", and "location".

    Follow these rules strictly:
    1. The "day" must be one of "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday".
    2. The "start_time" and "end_time" must be in 24-hour "HH:MM" format. Convert AM/PM times if necessary.
    3. If a piece of information like "location" is missing for a class, use a null value for that key.
    4. The output must be only the JSON array, with no other text or explanations.

    Here is the raw text to parse:
    ---
    ${extractedText}
    ---
  `;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonString = response.text();
    const cleanedJsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    const timetableData = JSON.parse(cleanedJsonString);
    return timetableData;
  } catch (error) {
    console.error('Error parsing timetable with Gemini:', error);
    throw new Error('Failed to generate timetable from text.');
  }
}

// ✅ NEW FUNCTION: Generates faculty/TA schedule based on constraints
async function generateFacultyTimetable(constraints) {
  // Construct a detailed prompt based on the provided constraints
  const prompt = `
    You are an AI assistant tasked with generating an optimal weekly teaching schedule for university faculty or teaching assistants based on given constraints. Output the schedule as a JSON array of objects.

    Constraints:
    - Target Role: ${constraints.targetRole || 'faculty'}
    - Assignee User ID: ${constraints.assigneeUserId}
    - Subjects to Schedule: ${constraints.subjects.join(', ')}
    - Preferred Days: ${constraints.preferredDays ? constraints.preferredDays.join(', ') : 'Any weekday'}
    - Preferred Time Slots: ${constraints.preferredTimeSlots ? constraints.preferredTimeSlots.join(', ') : 'Standard working hours (9 AM - 5 PM)'}
    - Avoid Clashes With (Existing Schedule): ${constraints.existingSchedule ? JSON.stringify(constraints.existingSchedule) : 'None'}
    - Room Availability: ${constraints.roomAvailability ? JSON.stringify(constraints.roomAvailability) : 'Assume standard classrooms available'}
    - Other Notes: ${constraints.otherNotes || 'Balance workload across the week.'}

    Generate a schedule trying to best satisfy these constraints. Each object in the output JSON array must represent a single class session and have these keys: "subject", "day", "start_time" (HH:MM format, 24-hour), "end_time" (HH:MM format, 24-hour), and "location" (suggest a generic location like 'Classroom A' if not specified).

    The final output must be ONLY the JSON array, with no other text, explanations, or markdown formatting.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonString = response.text();
    const cleanedJsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    const generatedSchedule = JSON.parse(cleanedJsonString);
    return generatedSchedule;
  } catch (error) {
    console.error('Error generating faculty schedule with Gemini:', error);
    throw new Error('Failed to generate faculty schedule.');
  }
}

// Export all functions
module.exports = {
  generateText,
  generateTimetableFromText,
  generateFacultyTimetable // 👈 Export the new function
};