const startBtn = document.getElementById('start-btn');
const responseBox = document.getElementById('response');
const statusText = document.getElementById('status');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.lang = 'auto';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

let currentTopic = "general";

startBtn.addEventListener('click', () => {
  recognition.start();
  statusText.textContent = "🎤 Listening... Say a topic or ask a question.";
});

recognition.onresult = async (event) => {
  const input = event.results[0][0].transcript.trim();
  const lowered = input.toLowerCase();

  const topics = ["cybersecurity", "stock market", "space craft", "submarine"];

  if (topics.includes(lowered)) {
    currentTopic = lowered;
    statusText.textContent = `📌 Topic set to: ${currentTopic}`;
    responseBox.textContent = "Now ask your question related to this topic.";
    return;
  }

  statusText.textContent = `🧠 Asking about ${currentTopic}...`;
  responseBox.textContent = "Thinking...";

  try {
    const answer = await fetchAnswer(input, currentTopic);
    responseBox.textContent = answer;
    speakAnswer(answer);
    statusText.textContent = "✅ Answer provided.";
  } catch (error) {
    responseBox.textContent = "⚠️ Error fetching response.";
    statusText.textContent = `❌ ${error.message}`;
  }
};

recognition.onerror = (event) => {
  statusText.textContent = '❌ Speech error: ' + event.error;
};

async function fetchAnswer(question, topic) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer YOUR_OPENAI_API_KEY",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: `You are a multilingual expert assistant focused on the topic of ${topic}. Respond concisely and clearly.` },
        { role: "user", content: question }
      ],
      temperature: 0.6
    })
  });

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

function speakAnswer(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'auto';
  speechSynthesis.speak(utterance);
}
