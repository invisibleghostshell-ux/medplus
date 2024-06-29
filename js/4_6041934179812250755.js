// Selecting necessary elements from the DOM
const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");
const chatbox = document.querySelector(".chatbox");

let userMessage = null; // Variable to store user's message
const API_KEY = "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"; 
const inputInitHeight = chatInput.scrollHeight;

// Function to create a chat <li> element with the passed message and class name
const createChatLi = (message, className) => {
  const chatLi = document.createElement("li");
  chatLi.classList.add("chat", className);
  let chatContent = className === "outgoing" ? `<p></p>` : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
  chatLi.innerHTML = chatContent;
  chatLi.querySelector("p").textContent = message;
  return chatLi; // Return chat <li> element
};


// Function to generate user-friendly advice based on the diagnoses
const generateAdvice = async (diagnoses) => {
  const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/openai-community/gpt2"; 

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`, 
    },
    body: JSON.stringify({
      inputs: diagnoses,
      wait_for_model: true
    }),
  };

  try {
    const response = await fetch(HUGGINGFACE_API_URL, requestOptions);

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('dta is:::',data)

    // Extract advice from the model response, assuming 'generated_text' contains the advice
    const advice = data[0].generated_text || "No advice generated"; // Adjust according to the actual response structure

    return advice;
  } catch (error) {
    console.error("Error during fetch:", error);
    return `Oops, something went wrong while generating advice. ${error.message}`;
  }
};

// Function to generate a response from the diagnosis API
const generateResponse = async (incomingChatLi) => {
  const DIAGNOSIS_API_URL = "https://api-inference.huggingface.co/models/Zabihin/Symptom_to_Diagnosis"; 
  const userMessage = incomingChatLi.querySelector("p").textContent;

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`, 
    },
    body: JSON.stringify({
      inputs: userMessage,
      wait_for_model: true
    }),
  };

  try {
    const response = await fetch(DIAGNOSIS_API_URL, requestOptions);

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error && data.error.includes("currently loading")) {
      const estimatedTime = data.estimated_time * 1000; // Convert to milliseconds
      incomingChatLi.querySelector("p").textContent = "The model is loading, please wait...";

      setTimeout(() => generateResponse(incomingChatLi), estimatedTime);
    } else if (data && Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
      const topResults = data[0].slice(0, 5).map(result => `${result.label}: ${(result.score * 100).toFixed(2)}%`).join(', ');

      // Generate user-friendly advice based on the top diagnoses
      const advice = await generateAdvice(topResults);
      console.log(advice)
      incomingChatLi.querySelector("p").textContent = `Top diagnoses: ${topResults}\n\nAdvice: ${advice}`;
    } else {
      throw new Error("Invalid response structure from the diagnosis model.");
    }
  } catch (error) {
    console.error("Error during fetch:", error);
    incomingChatLi.querySelector("p").classList.add("error");
    incomingChatLi.querySelector("p").textContent = `Oops, something went wrong. ${error.message}`;
  } finally {
    chatbox.scrollTo(0, chatbox.scrollHeight);
  }
};




// Function to handle user input and chat flow
const handleChat = () => {
  userMessage = chatInput.value.trim(); // Get user entered message and remove extra whitespace
  if (!userMessage) return;

  // Clear the input textarea and set its height to default
  chatInput.value = "";
  chatInput.style.height = `${inputInitHeight}px`;

  // Append the user's message to the chatbox
  const outgoingChatLi = createChatLi(userMessage, "outgoing");
  chatbox.appendChild(outgoingChatLi);
  chatbox.scrollTo(0, chatbox.scrollHeight);

  setTimeout(() => {
    // Display "Typing..." message while waiting for the response
    const incomingChatLi = createChatLi("Typing...", "incoming");
    chatbox.appendChild(incomingChatLi);
    generateResponse(incomingChatLi);
  }, 600);
};

// Adjust the height of the input textarea based on its content
chatInput.addEventListener("input", () => {
  chatInput.style.height = `${inputInitHeight}px`;
  chatInput.style.height = `${chatInput.scrollHeight}px`;
});

// Handle chat on pressing Enter key without the Shift key
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
    e.preventDefault();
    handleChat();
  }
});

// Handle chat on clicking the send button
sendChatBtn.addEventListener("click", handleChat);

// Close the chatbot
closeBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));

// Toggle the chatbot visibility
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
