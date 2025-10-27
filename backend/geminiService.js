// geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Ensure API key is loaded
if (!process.env.GEMINI_API_KEY) {
  console.error("FATAL ERROR: GEMINI_API_KEY environment variable not found.");
  process.exit(1); // Stop the server if key is missing
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Use the model name you confirmed works (e.g., gemini-2.5-pro or gemini-1.5-flash-latest)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

// Generic text generation (Improved Error Handling)
async function generateText(prompt) {
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
     console.warn('generateText called with empty or invalid prompt.');
     return ''; // Return empty string for invalid prompts
  }
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response?.text ? response.text() : '';
    if (!text) {
        console.warn('Gemini generateText returned an empty response.');
    }
    return text;
  } catch (error) {
    console.error(`Error in Gemini Service (generateText) for prompt "${prompt.substring(0,50)}...":`, error?.message || error);
     if (error?.response?.candidates?.[0]?.finishReason === 'SAFETY') {
        console.warn("Gemini Response blocked due to safety settings.");
        return "Response blocked due to safety settings.";
     }
     if (error?.status === 503 || error?.message?.includes('503')) {
         console.warn("Gemini model is overloaded.");
         return "The AI model is currently overloaded. Please try again later.";
     }
      if (error?.status === 404 || error?.message?.includes('404')) {
         console.error("Gemini model not found or API endpoint issue.");
         // Let the calling function handle this specific error based on context
         throw error;
     }
    // General error
    throw new Error('Failed to generate content from Gemini API.');
  }
}


// Student timetable parsing from text (Strict Prompt V3)
async function generateTimetableFromText(extractedText) {
  if (!extractedText || typeof extractedText !== 'string' || extractedText.trim() === '') {
      console.warn('generateTimetableFromText called with empty text.');
      return []; // Return empty array if input is empty
  }

  const prompt = `
    Analyze the following raw text from a university timetable PDF. Convert it into a structured JSON array representing class sessions, following these rules VERY STRICTLY.

    **Input Text Analysis Rules (Strict Adherence Required):**
    1.  **Identify Time Headers:** Find the row defining time slots precisely (e.g., "9:00-9:55", "10:00-10:55", "11:00-11:55", "12:00-12:55", "02:00-02:55", "03:00-03:55", "04:00-04:55", "05:00-05:55"). These define the exact start and end times. Convert these to HH:MM 24-hour format (e.g., "02:00-02:55" becomes "14:00" and "14:55").
    2.  **Identify Subject Legend:** Find the mapping between slot codes (e.g., 'L', 'F', 'E', 'H', 'G', 'X', 'U', 'Z', 'B', 'P', 'I') and full subject names.
    3.  **Handle Subject Variations:** Treat subjects with parenthetical differences as distinct. Specifically: Map code 'B' to "International Language Competency (Basic)". Map code 'P' to "International Language Competency (Advance2)". Map code 'I' to "International Language Competency (Advance1)".
    4.  **Grid Mapping (Most Critical - Follow Precisely):** Process the grid strictly row by row (Day) and column by column (Time Header). For a given Day and Time Header, look at the code(s) directly in that specific cell. If a legend code (like 'H') is found, create ONE JSON object for that class using the corresponding subject name, day, start_time, and end_time.
    5.  **EMPTY SLOTS:** If the cell for a specific Day and Time Header is BLANK, EMPTY, '-', or has a code NOT in the legend, **DO NOT create a JSON object for that slot.** Leave it as a gap.
    6.  **NO SHIFTING / NO ASSUMPTIONS:** Absolutely **DO NOT** shift a class from a later time slot to fill an earlier empty slot. If Wednesday 11:00-11:55 is empty and code 'E' is under 12:00-12:55, the object for 'E' MUST have "start_time": "12:00", "end_time": "12:55". Assign times based *only* on the Time Header column the code is directly under.
    7.  **Room Location:** Extract the general Room Number (e.g., "Room No 122") and add it as the "location" key for every class object. Use null if unknown.
    8.  **Single Slot Mapping:** Create one entry per code, strictly matching the time slot defined by the column header.

    **Output JSON Rules:**
    // ============================================
    // ✅ --- FIX: Removed literal [] ---
    // ============================================
    1.  Output ONLY a valid JSON array. Do not include explanations, markdown formatting like json, or any text before or after the array.
    // ============================================
    2.  Each object MUST have keys: "subject", "day", "start_time" (HH:MM 24hr), "end_time" (HH:MM 24hr), "location".

    **Example Negative Constraint:** If Wednesday 11:00-11:55 is empty and 'E' appears under 12:00-12:55, **DO NOT** output an object like \`\\{"subject": "Problem Solving...", "day": "Wednesday", "start_time": "11:00", ...\\}\`. The correct output must be \`\\{"subject": "Problem Solving...", "day": "Wednesday", "start_time": "12:00", "end_time": "12:55", ...\\}\`.

    **Raw Text to Parse:**
    ---
    ${extractedText}
    ---
  `;

  try {
    console.log("Sending FINAL STRICT prompt V4 to Gemini for timetable parsing...");
    const result = await model.generateContent(prompt);
    const response = await result.response;

    if (!response || !response.text) { throw new Error('Gemini returned no response or empty text for timetable.'); }
    const jsonString = response.text();
    let cleanedJsonString = jsonString.replace(/^```json/i, '').replace(/```$/, '').trim(); // Define here for potential use in SyntaxError
    // console.log("Raw Gemini Response Text (Strict V4):", jsonString);
    // console.log("Cleaned JSON String (Strict V4):", cleanedJsonString);
    if (!cleanedJsonString.startsWith('[') || !cleanedJsonString.endsWith(']')) { throw new Error(`AI response did not start/end with array brackets. Cleaned response: ${cleanedJsonString.substring(0, 100)}...`); }
    const timetableData = JSON.parse(cleanedJsonString);
    if (!Array.isArray(timetableData)) { throw new Error('Parsed timetable data is not a JSON array.'); }
    console.log(`Successfully parsed ${timetableData.length} timetable entries from Gemini (Strict V4).`);
    return timetableData;

  } catch (error) {
    let cleanedJsonString = ''; // Define here for potential use in SyntaxError
     try { cleanedJsonString = error?.response?.text ? error.response.text().replace(/^```json/i, '').replace(/```$/, '').trim() : 'unavailable'; } catch {}
    console.error('Error parsing timetable with Gemini (Strict V4):', error?.message || error);
     if (error?.response?.candidates?.[0]?.finishReason === 'SAFETY') { throw new Error("Timetable generation blocked due to safety settings."); }
     if (error?.status === 503 || error?.message?.includes('503')) { throw new Error("The AI model for timetable parsing is currently overloaded. Please try again later."); }
     if (error?.status === 404 || error?.message?.includes('404')) { throw new Error('Gemini timetable model not found. Check model name in geminiService.js.'); }
     if (error instanceof SyntaxError) { throw new Error(`Failed to parse timetable AI response as JSON. Cleaned response was potentially: ${cleanedJsonString}. Error: ${error.message}`); }
    throw new Error('Failed to generate timetable structure from text.');
  }
}

// Faculty timetable generation (Strict Prompt V3)
async function generateFacultyTimetable(constraints) {
  if (!constraints || typeof constraints !== 'object' || !Array.isArray(constraints.subjects) || !constraints.assigneeUserId) {
      console.warn('generateFacultyTimetable called with invalid constraints:', constraints); return [];
  }
  const allowedSubjectsList = constraints.subjects.map(s => `"${s}"`).join(', ');

  const prompt = `
    You are an AI assistant generating a weekly teaching schedule based STRICTLY on the provided constraints.

    **Constraints (Mandatory Adherence):**
    1.  **Assignee:** Schedule is for user ID ${constraints.assigneeUserId}, role '${constraints.targetRole || 'faculty'}'.
    2.  **Subjects:** MUST schedule sessions ONLY for: **[${allowedSubjectsList}]**. DO NOT include any other subjects. Repeat: ONLY use subjects from this list: [${allowedSubjectsList}].
    3.  **Preferred Days:** ${constraints.preferredDays ? constraints.preferredDays.join(', ') : 'Any standard weekday (Monday-Friday)'}.
    4.  **Preferred Time Slots:** ${constraints.preferredTimeSlots ? constraints.preferredTimeSlots.join(', ') : 'Standard working hours (09:00 - 17:00)'}.
    5.  **Avoid Clashes:** Do not overlap with existing schedule: ${constraints.existingSchedule && constraints.existingSchedule.length > 0 ? JSON.stringify(constraints.existingSchedule) : 'None'}.
    6.  **Other Notes:** ${constraints.otherNotes || 'Balance workload. Standard duration 50-90 mins.'}

    **Output Rules (Strict):**
    // ============================================
    // ✅ --- FIX: Removed literal [] ---
    // ============================================
    1.  Output ONLY a valid JSON array. No explanations, markdown, or text outside the array.
    // ============================================
    2.  Each object MUST have keys: "subject" (MUST be one of [${allowedSubjectsList}]), "day", "start_time" (HH:MM 24hr), "end_time" (HH:MM 24hr), "location".

    **Example Negative Constraint:** If allowed subjects are ["Calculus", "Physics"], DO NOT output sessions for "Math" or "English". Ensure every "subject" field matches exactly one from: [${allowedSubjectsList}].
  `;

  try {
    console.log("Sending STRICTER prompt V4 to Gemini for faculty schedule...");
    console.log("Allowed subjects:", allowedSubjectsList);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    if (!response || !response.text) { throw new Error('Gemini returned no response for faculty schedule.'); }
    const jsonString = response.text();
    let cleanedJsonString = jsonString.replace(/^```json/i, '').replace(/```$/, '').trim(); // Define here for error msg
    // console.log("Raw Faculty Schedule Response (V4):", jsonString);
    // console.log("Cleaned Faculty Schedule Response (V4):", cleanedJsonString);
    if (!cleanedJsonString.startsWith('[') || !cleanedJsonString.endsWith(']')) { throw new Error(`Faculty schedule AI response did not start/end with array brackets. Response: ${cleanedJsonString.substring(0,100)}...`); }
    const generatedSchedule = JSON.parse(cleanedJsonString);
     if (!Array.isArray(generatedSchedule)) { throw new Error('Parsed faculty schedule is not a JSON array.'); }
    // Optional Validation
    const generatedSubjects = new Set(generatedSchedule.map(item => item.subject)); const allowedSubjectsSet = new Set(constraints.subjects);
    generatedSubjects.forEach(sub => { if (!allowedSubjectsSet.has(sub)) { console.warn(`AI generated unexpected subject: "${sub}"`); } });
    console.log(`Gemini generated ${generatedSchedule.length} schedule entries (V4).`);
    return generatedSchedule;
  } catch (error) {
     let cleanedJsonString = ''; try { cleanedJsonString = error?.response?.text ? error.response.text().replace(/^```json/i, '').replace(/```$/, '').trim() : 'unavailable'; } catch {}
    console.error('Error generating faculty schedule with Gemini (V4):', error?.message || error);
     if (error?.response?.candidates?.[0]?.finishReason === 'SAFETY') { throw new Error("Faculty schedule generation blocked due to safety settings."); }
     if (error?.status === 503 || error?.message?.includes('503')) { throw new Error("The AI model for faculty schedule generation is currently overloaded."); }
     if (error?.status === 404 || error?.message?.includes('404')) { throw new Error('Gemini faculty schedule model not found.'); }
     if (error instanceof SyntaxError) { throw new Error(`Failed to parse faculty schedule AI response as JSON. Cleaned response was potentially: ${cleanedJsonString}. Error: ${error.message}`); }
    throw new Error('Failed to generate faculty schedule.');
  }
}


// Export all functions
module.exports = {
  generateText,
  generateTimetableFromText,
  generateFacultyTimetable
};