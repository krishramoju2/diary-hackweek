const startBtn = document.getElementById('start-btn');
const responseBox = document.getElementById('response');
const statusText = document.getElementById('status');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.lang = 'auto';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

startBtn.addEventListener('click', () => {
  recognition.start();
  statusText.textContent = "🎤 Listening... Ask anything.";
});

recognition.onresult = async (event) => {
  const question = event.results[0][0].transcript;
  statusText.textContent = `🧠 Thinking...`;
  responseBox.textContent = "";

  try {
    const answer = await fetchAnswer(question);
    responseBox.textContent = answer;
    speakAnswer(answer);
    statusText.textContent = "✅ Answer provided. Ask more!";
  } catch (error) {
    responseBox.textContent = "⚠️ Failed to get answer.";
    statusText.textContent = "❌ Error: " + error.message;
  }
};

recognition.onerror = (event) => {
  statusText.textContent = '❌ Error: ' + event.error;
};

async function fetchAnswer(prompt) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer YOUR_OPENAI_API_KEY",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    })
  });

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

function speakAnswer(text) {
  const synth = window.speechSynthesis;
  const utter = new SpeechSynthesisUtterance(text);
  synth.speak(utter);
}
