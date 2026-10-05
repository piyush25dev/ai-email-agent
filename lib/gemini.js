const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function callOpenRouter({
  messages,
  model = process.env.OPENROUTER_MODEL || "openrouter/free",
  temperature = 0.1,
}) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is missing from environment variables");
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(process.env.APP_URL
        ? { "HTTP-Referer": process.env.APP_URL }
        : {}),
      "X-Title": "AI Email Agent",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      response_format: {
        type: "json_object",
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage =
      data?.error?.message ||
      data?.message ||
      `OpenRouter request failed with status ${response.status}`;

    throw new Error(errorMessage);
  }

  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenRouter returned an empty response");
  }

  return content;
}