interface ChatOptions {
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  model?: string;
  provider?: "ollama" | "localai";
  temperature?: number;
  max_tokens?: number;
}

export async function generateChatCompletion(options: ChatOptions) {
  const {
    messages,
    model,
    provider = "ollama",
    temperature = 0.7,
    max_tokens = 2000,
  } = options;

  switch (provider) {
    case "ollama": {
      const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
      const modelName = model || "llama2";

      // Separate system message
      const systemMessage = messages.find((m) => m.role === "system");
      const conversationMessages = messages.filter((m) => m.role !== "system");

      // Format messages for Ollama API
      const formattedMessages = conversationMessages.map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      }));

      const response = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName,
          messages: formattedMessages,
          stream: false,
          options: {
            temperature,
            num_predict: max_tokens,
            top_p: 0.9, // Nucleus sampling for better quality
            top_k: 40, // Top-k sampling for better quality
            repeat_penalty: 1.1, // Reduce repetition
          },
          ...(systemMessage && { system: systemMessage.content }),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ollama API error: ${response.status} ${error}`);
      }

      const result = (await response.json()) as {
        message?: { content?: string; role?: string };
        model?: string;
        done?: boolean;
      };

      return {
        content: result.message?.content || "",
        model: result.model || modelName,
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      };
    }

    case "localai": {
      const localaiUrl = process.env.LOCALAI_BASE_URL || "http://localhost:8080";
      const modelName = model || "gpt-3.5-turbo";

      const response = await fetch(`${localaiUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName,
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          temperature,
          max_tokens,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`LocalAI API error: ${response.status} ${error}`);
      }

      const result = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        model?: string;
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        };
      };

      return {
        content: result.choices?.[0]?.message?.content || "",
        model: result.model || modelName,
        usage: result.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      };
    }

    default:
      throw new Error(`Unsupported chat provider: ${provider}`);
  }
}
