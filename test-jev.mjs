import fs from "node:fs";

// Load .env file if available
if (fs.existsSync(".env")) {
  try {
    process.loadEnvFile(".env");
  } catch (e) {
    // Ignore error if loadEnvFile fails
  }
}

const apiKey = process.env.TYPESAFE_API_KEY || process.env.JEV_API_KEY;

if (!apiKey) {
  console.error("Error: TYPESAFE_API_KEY (or JEV_API_KEY) environment variable is not set.");
  process.exit(1);
}

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";

const payload = {
  state: "The customer says the app crashed twice today and they can't log in.",
  model: "jev-latest",
  questions: {
    urgency: {
      type: "choice",
      instructions: "How urgent is this issue?",
      criteria: {
        low: null,
        medium: null,
        high: null,
      },
    },
  },
};

console.log(`Sending request to ${ENDPOINT}...`);
console.log("Payload:", JSON.stringify(payload, null, 2));

const startTime = performance.now();

try {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const durationMs = (performance.now() - startTime).toFixed(2);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`\nRequest failed with status ${response.status} (${response.statusText}):`);
    console.error(errorText);
    console.log(`\nResponse time: ${durationMs} ms`);
    process.exit(1);
  }

  const data = await response.json();

  console.log(`\n--- Response (${durationMs} ms) ---`);
  console.log(JSON.stringify(data, null, 2));

  console.log("\n--- Summary ---");
  const urgencyAnswer = data.answers?.urgency;
  if (urgencyAnswer) {
    console.log(`Answer / Choice : ${urgencyAnswer.choice}`);
    console.log(`Confidence      : ${urgencyAnswer.confidence}`);
    console.log(`Probabilities   :`, urgencyAnswer.probabilities);
  }
  if (data.usage) {
    console.log(`Tokens Used     : input=${data.usage.input_tokens}, output=${data.usage.output_tokens}`);
  }
  console.log(`Response Time   : ${durationMs} ms`);
} catch (error) {
  const durationMs = (performance.now() - startTime).toFixed(2);
  console.error(`\nNetwork or unexpected error after ${durationMs} ms:`, error);
  process.exit(1);
}
