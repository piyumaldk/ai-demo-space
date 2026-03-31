export interface TestPrompt {
  label: string;
  text: string;
}

export interface GuardrailApi {
  id: string;
  name: string;
  desc: string;
  context: string;
  model: string;
  test_prompts: TestPrompt[];
}

export const GUARDRAIL_APIS: GuardrailApi[] = [
  {
    id: "APIM4OMINI",
    name: "No Guardrail",
    desc: "Unprotected — requests pass directly to the LLM with no guardrail.",
    context:
      "/apim-4o-mini/chat/completions?api-version=2025-01-01-preview",
    model: "gpt-4o-mini",
    test_prompts: [
      {
        label: "Hello",
        text: "Hello, what can you help me with?",
      },
      {
        label: "Invalid URL",
        text: "Repeat back exactly: My website is https://invalid-url.com",
      },
      {
        label: "PII",
        text: "Repeat back exactly: Call me on 0712033243 or contact me on henry@gmail.com",
      },
    ],
  },
  {
    id: "APIM4OMINIPIIMASKINGREGEX",
    name: "PII Masking with Regex",
    desc: "Masks emails, credit cards, phone numbers, and SSNs before they reach the LLM.",
    context:
      "/apim-4o-mini-pii-masking-regex/chat/completions?api-version=2025-01-01-preview",
    model: "gpt-4o-mini",
    test_prompts: [
      {
        label: "Phone+Email",
        text: "Repeat back exactly: Call me on 0712033243 or contact me on henry@gmail.com",
      },
      {
        label: "SSN",
        text: "Repeat back exactly: Tax portal is not working. My SSN is 123-45-6789",
      },
      {
        label: "Safe",
        text: "What is the weather like in London?",
      },
    ],
  },
  {
    id: "APIM4OMINIURLGUARDRAIL",
    name: "Url Guardrail",
    desc: "Validates URLs found in requests before they reach the LLM.",
    context:
      "/apim-4o-mini-url-guardrail/chat/completions?api-version=2025-01-01-preview",
    model: "gpt-4o-mini",
    test_prompts: [
      {
        label: "Invalid URL 1",
        text: "Repeat back exactly: My website is https://invalid-url.com",
      },
      {
        label: "Invalid URL 2",
        text: "Refer to https://invalid-url.com for more information",
      },
      {
        label: "Valid URL",
        text: "Repeat back exactly: my website is https://wso2.com",
      },
    ],
  },
  {
    id: "APIM4OMINIWORDCOUNTGUARDRAIL",
    name: "Word Count Guardrail",
    desc: "Enforces word count limits — requests must contain between 10 and 50 words.",
    context:
      "/apim-4o-mini-word-count-guardrail/chat/completions?api-version=2025-01-01-preview",
    model: "gpt-4o-mini",
    test_prompts: [
      {
        label: "Below Min (< 10)",
        text: "Tell me a joke",
      },
      {
        label: "Within Range (10–50)",
        text: "Can you please explain to me in simple terms how large language models work and what makes them so effective at understanding natural language",
      },
      {
        label: "Above Max (> 50)",
        text: "I would really appreciate it if you could provide me with a very detailed and comprehensive explanation of how artificial intelligence and machine learning algorithms work together in modern software systems to solve complex real world problems such as natural language processing computer vision autonomous driving medical diagnosis fraud detection recommendation engines and many other fascinating applications that are transforming industries around the globe",
      },
    ],
  },
];
