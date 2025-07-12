console.log("✅ background.js loaded!");

const GEMINI_API_KEY = "AIzaSyBHhcsarlydg-iHEJCu2t_yB3MPD0GgWH4"; // 🔁 Replace with your actual Gemini API key
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + GEMINI_API_KEY;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      console.log("📨 Message received in background.js:", msg);

  // Test message only
  if (msg.type === "TEST_MESSAGE") {
    console.log("🔥 TEST_MESSAGE handled successfully!");
  }
  const tabId = sender?.tab?.id;

  // Step 1: Receive tab content and generate summary
  if (msg.type === "PAGE_CONTENT") {
    console.log("📥 Got PAGE_CONTENT. Summarizing...");
    summarizeAndStore(tabId, msg.content);
  }

  // Step 2: Send stored memory to popup
 if (msg.type === "GET_MEMORY") {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) {
      console.error("❌ No active tab found while retrieving memory.");
      sendResponse({ summary: "", notes: [], queries: [] });
      return;
    }

    const tabId = tabs[0].id;
    chrome.storage.local.get([String(tabId)], (data) => {
      const memory = data[String(tabId)] || { summary: "", notes: [], queries: [] };
      sendResponse(memory);
    });
  });
  return true;
}

  // Step 3: Save a user note per tab
  if (msg.type === "SAVE_NOTE") {
    chrome.storage.local.get([String(msg.tabId)], (data) => {
      const memory = data[String(msg.tabId)] || { summary: "", notes: [], queries: [] };
      memory.notes.push(msg.note);
      if (memory.notes.length > 5) memory.notes = memory.notes.slice(-5); // Keep last 5
      chrome.storage.local.set({ [String(msg.tabId)]: memory });
    });
  }

  // Step 4: Handle query from popup (Ask Gemini)
  if (msg.type === "ASK_AI") {
   askGemini(msg.query).then((response) => {
    sendResponse({ response });

    // Save query to tab memory
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        console.error("❌ No active tab found while saving AI query.");
        return;
      }

      const tabId = tabs[0].id;
      chrome.storage.local.get([String(tabId)], (data) => {
        const memory = data[String(tabId)] || { summary: "", notes: [], queries: [] };
        memory.queries.push(msg.query);
        if (memory.queries.length > 5) memory.queries = memory.queries.slice(-5); // Keep last 5
        chrome.storage.local.set({ [String(tabId)]: memory });
      });
    });
  });
  return true;
}
});

// 🔍 Function: Summarize tab content and save to local storage
async function summarizeAndStore(tabId, content) {
  const prompt = `Summarize the following webpage content:\n\n${content.slice(0, 4000)}`;
  const summary = await askGemini(prompt);
console.log("📝 Summary from Gemini:", summary);
  chrome.storage.local.set({
    [String(tabId)]: {
      summary: summary || "No summary available.",
      notes: [],
      queries: []
    }
  });
}

// 💡 Function: Send prompt to Gemini and return response
async function askGemini(text) {
  const body = {
    contents: [
      {
        parts: [{ text: text }]
      }
    ]
  };

  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    console.log("🤖 Gemini raw response:", data);
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, no response.";
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Error fetching Gemini response.";
  }
}


