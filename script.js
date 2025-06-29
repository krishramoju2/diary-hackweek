const startBtn = document.getElementById('start-btn');
const responseBox = document.getElementById('response');
const statusText = document.getElementById('status');
const timeline = document.getElementById('timeline');
const fontSelector = document.getElementById('font-selector');
const bgSelector = document.getElementById('bg-selector');

const exportSelect = document.createElement('select');
exportSelect.innerHTML = `
  <option disabled selected>📁 Export Q&A</option>
  <option value="json">Export as JSON</option>
  <option value="txt">Export as TXT</option>
  <option value="csv">Export as CSV</option>
`;
document.querySelector('.container').appendChild(exportSelect);

exportSelect.addEventListener('change', () => {
  const format = exportSelect.value;
  if (format === 'json') exportAsJSON();
  if (format === 'txt') exportAsTXT();
  if (format === 'csv') exportAsCSV();
  exportSelect.selectedIndex = 0;
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'auto';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

let currentTopic = null;
let conversationHistory = loadFromStorage();

const topics = [
  "cybersecurity", "stock market", "space craft", "submarine",
  "ai", "medicine", "climate change"
];

const knowledgeBase = {
  cybersecurity: {
    "what is phishing": "Phishing tricks users into giving away sensitive information.",
    "what is ransomware": "Ransomware locks files and demands payment."
  },
  "stock market": {
    "what is nifty": "Nifty is an index of 50 top Indian companies.",
    "what is sensex": "Sensex tracks 30 companies on BSE."
  },
  "space craft": {
    "what is satellite": "Satellites orbit Earth for communication or observation.",
    "what is isro": "ISRO is India's space agency."
  },
  submarine: {
    "what is sonar": "SONAR detects underwater objects using sound waves.",
    "what is torpedo": "A torpedo is an underwater missile."
  },
  ai: {
    "what is ai": "AI is machine-simulated human intelligence.",
    "what is ml": "ML lets systems learn from data to improve."
  },
  medicine: {
    "what is vaccine": "Vaccines train your body to fight diseases.",
    "what is antibiotic": "Antibiotics fight bacterial infections."
  },
  "climate change": {
    "what is global warming": "Global warming is the rise in Earth's temperature.",
    "how to stop climate change": "Reduce carbon footprint and use renewables."
  }
};

conversationHistory.forEach(entry => {
  updateTimeline(entry.question, entry.response, entry.topic);
});

startBtn.addEventListener('click', () => {
  recognition.start();
  statusText.textContent = "🎤 Listening...";
});

recognition.onresult = (event) => {
  const spoken = event.results[0][0].transcript.trim().toLowerCase();

  if (spoken.startsWith("summarize all questions from") || spoken.startsWith("summarize all questions about")) {
    const match = spoken.match(/summarize all questions (?:from|about) (.+)/);
    if (match) {
      const requestedTopic = match[1].trim().toLowerCase();
      summarizeTopic(requestedTopic);
    } else {
      responseBox.textContent = "❗ Couldn't understand the topic to summarize.";
      speak("Please say the topic you want summarized.");
    }
    return;
  }

  for (let topic of topics) {
    if (spoken.includes(topic)) {
      currentTopic = topic;
      statusText.textContent = `📌 Topic changed to: ${currentTopic}`;
      responseBox.textContent = `Ask a question about ${currentTopic}.`;
      speak(`Topic set to ${currentTopic}`);
      return;
    }
  }

  if (!currentTopic) {
    statusText.textContent = "❗ Please say a topic first.";
    responseBox.textContent = "Say one of: " + topics.join(", ");
    speak("Please say a topic first.");
    return;
  }

  const topicQA = knowledgeBase[currentTopic];
  let bestMatch = null;
  let bestKey = null;

  for (const question in topicQA) {
    if (spoken.includes(question)) {
      bestKey = question;
      bestMatch = topicQA[question];
      break;
    }
  }

  let finalResponse = "Sorry, I don't have an answer for that yet.";
  if (bestMatch) {
    const previous = conversationHistory.find(hist => hist.question === bestKey && hist.topic === currentTopic);
    if (previous) {
      finalResponse = bestMatch + " (Repeated)";
    } else {
      finalResponse = bestMatch;
      const entry = { question: bestKey, response: bestMatch, topic: currentTopic, time: new Date() };
      conversationHistory.push(entry);
      saveToStorage();
    }
  }

  responseBox.textContent = finalResponse;
  speak(finalResponse);
  statusText.textContent = "✅ Response delivered.";
  updateTimeline(spoken, finalResponse, currentTopic);
};

recognition.onerror = (event) => {
  statusText.textContent = "❌ Error: " + event.error;
};

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en';
  speechSynthesis.speak(utterance);
}

function updateTimeline(prompt, response, topic) {
  const entry = document.createElement('div');
  entry.className = 'timeline-entry';
  entry.style.fontFamily = fontSelector.value;
  entry.innerHTML = `
    <h3>${topic.toUpperCase()}</h3>
    <p><strong>You:</strong> ${prompt}</p>
    <p><strong>Assistant:</strong> ${response}</p>
  `;
  timeline.prepend(entry);
}

fontSelector.addEventListener('change', () => {
  document.querySelectorAll('.timeline-entry').forEach(entry => {
    entry.style.fontFamily = fontSelector.value;
  });
});

bgSelector.addEventListener('change', () => {
  document.body.className = '';
  document.body.classList.add(bgSelector.value);
});

function summarizeTopic(topicName) {
  const filtered = conversationHistory.filter(entry => entry.topic === topicName.toLowerCase());
  if (filtered.length === 0) {
    responseBox.textContent = `No questions found for topic "${topicName}".`;
    speak(`No questions found for ${topicName}.`);
    return;
  }

  const summary = filtered.map((entry, idx) => `Q${idx + 1}: ${entry.question}?`).join(" ");
  const summaryMessage = `Here's a summary of ${filtered.length} question(s) from ${topicName}: ${summary}`;

  responseBox.textContent = summaryMessage;
  speak(summaryMessage);
  updateTimeline(`Summary requested for ${topicName}`, summaryMessage, topicName);
}

function saveToStorage() {
  localStorage.setItem('chatbot_history', JSON.stringify(conversationHistory));
}

function loadFromStorage() {
  const data = localStorage.getItem('chatbot_history');
  return data ? JSON.parse(data) : [];
}

function exportAsJSON() {
  const blob = new Blob([JSON.stringify(conversationHistory, null, 2)], { type: "application/json" });
  downloadBlob(blob, "qa_log.json");
}

function exportAsTXT() {
  const text = conversationHistory.map(entry => {
    return `TOPIC: ${entry.topic}\nQ: ${entry.question}\nA: ${entry.response}\n---`;
  }).join("\n\n");
  const blob = new Blob([text], { type: "text/plain" });
  downloadBlob(blob, "qa_log.txt");
}

function exportAsCSV() {
  const header = "Topic,Question,Response,Time\n";
  const rows = conversationHistory.map(entry =>
    `${entry.topic},"${entry.question.replace(/"/g, '""')}","${entry.response.replace(/"/g, '""')}",${entry.time}`
  );
  const blob = new Blob([header + rows.join("\n")], { type: "text/csv" });
  downloadBlob(blob, "qa_log.csv");
}

function downloadBlob(blob, filename) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
