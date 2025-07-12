console.log("✅ popup.js loaded!");

chrome.runtime.sendMessage({ type: "TEST_MESSAGE" });
document.addEventListener("DOMContentLoaded", () => {
    chrome.runtime.sendMessage({ type: "TEST_MESSAGE" });

  chrome.runtime.sendMessage({ type: "GET_MEMORY" }, (memory) => {
    document.getElementById("summary").innerText = memory.summary || "No summary yet.";
    const notesList = document.getElementById("notes");
    (memory.notes || []).forEach((note) => {
      const li = document.createElement("li");
      li.textContent = note;
      notesList.appendChild(li);
    });
  });

  document.getElementById("saveNote").addEventListener("click", () => {
    const note = document.getElementById("noteInput").value;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id;
      chrome.runtime.sendMessage({ type: "SAVE_NOTE", tabId, note });
    });
  });

  document.getElementById("askAI").addEventListener("click", () => {
    const query = document.getElementById("queryInput").value;
    chrome.runtime.sendMessage({ type: "ASK_AI", query }, (res) => {
      document.getElementById("response").innerText = res.response;
    });
  });
});
