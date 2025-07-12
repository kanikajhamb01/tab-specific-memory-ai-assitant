const pageText = document.body.innerText;

chrome.runtime.sendMessage({
  type: "PAGE_CONTENT",
  content: pageText
});
console.log("📄 Sent page content to background");

