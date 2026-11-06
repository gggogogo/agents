# LangChain RAG CLI Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a CLI RAG agent that crawls LangChain docs, indexes them into a vector store, and answers questions via retrieval-augmented generation.

**Architecture:** Modular TypeScript project: config → loader → splitter → vectorstore → chain → CLI loop. Uses LCEL chains, MemoryVectorStore with JSON file persistence, and OpenAI-compatible DeepSeek for both LLM and embeddings.

**Tech Stack:** Node.js, TypeScript, LangChain.js, `@langchain/openai`, `@langchain/community`, cheerio, tsx

## Global Constraints

- LLM: DeepSeek self-hosted, config from `CRSEC_MODEL_BASE_URL` + `CRSEC_MODEL_NAME` env vars, no API key
- Embedding: same DeepSeek endpoint (OpenAI-compatible `/v1/embeddings`)
- Document source: LangChain JS docs at `https://js.langchain.com/docs`
- CLI: Node.js `readline`, `/clear` `/stat` `/exit` commands
- Persistence: split documents stored as JSON, re-indexed on load
- Chunk size: 1000, overlap: 200, retrieval k: 4, max history: 10 rounds
- Package manager: npm, runner: tsx

---

### Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`

**Produces:**
- `npm install` installs all dependencies
- `npx tsx src/index.ts` runs the project

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "langchain-rag-agent",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "tsx src/index.ts",
    "dev": "tsx watch src/index.ts"
  },
  "dependencies": {
    "langchain": "^0.3.0",
    "@langchain/core": "^0.3.0",
    "@langchain/openai": "^0.3.0",
    "@langchain/community": "^0.3.0",
    "cheerio": "^1.0.0"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Install dependencies**

```bash
npm install
```

Expected: all packages installed without error.

- [ ] **Step 4: Commit**

```bash
git add package.json tsconfig.json package-lock.json
git commit -m "chore: project setup with langchain dependencies"
```

---

### Task 2: Configuration Module

**Files:**
- Create: `src/config.ts`

**Produces:**
- `CONFIG` object with all constants

- [ ] **Step 1: Write `src/config.ts`**

```typescript
export const CONFIG = {
  DOCS_URL: "https://js.langchain.com/docs",
  DOCS_URLS: [
    "https://js.langchain.com/docs/introduction",
    "https://js.langchain.com/docs/tutorials",
    "https://js.langchain.com/docs/how_to",
    "https://js.langchain.com/docs/concepts",
  ],
  CHUNK_SIZE: 1000,
  CHUNK_OVERLAP: 200,
  RETRIEVAL_K: 4,
  MAX_HISTORY_ROUNDS: 10,
  DOCS_JSON_PATH: "./data/documents.json",
  MODEL_BASE_URL: process.env.CRSEC_MODEL_BASE_URL || "http://localhost:8000/v1",
  MODEL_NAME: process.env.CRSEC_MODEL_NAME || "deepseek-chat",
};
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/config.ts
git commit -m "feat: add configuration module"
```

---

### Task 3: Document Loader

**Files:**
- Create: `src/loader.ts`

**Consumes:** `CONFIG` from `src/config.ts`
**Produces:** `loadDocuments(): Promise<Document[]>`

- [ ] **Step 1: Write `src/loader.ts`**

```typescript
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { Document } from "@langchain/core/documents";
import { CONFIG } from "./config";

export async function loadDocuments(): Promise<Document[]> {
  const allDocs: Document[] = [];
  const failedUrls: string[] = [];

  for (const url of CONFIG.DOCS_URLS) {
    try {
      console.log(`  Fetching: ${url}`);
      const loader = new CheerioWebBaseLoader(url);
      const docs = await loader.load();
      for (const doc of docs) {
        doc.metadata = { ...doc.metadata, source: url };
      }
      allDocs.push(...docs);
      console.log(`    → ${docs.length} documents loaded`);
    } catch (err) {
      console.error(`  Failed: ${url} — ${(err as Error).message}`);
      failedUrls.push(url);
    }
  }

  console.log(`\nTotal: ${allDocs.length} documents from ${CONFIG.DOCS_URLS.length} URLs`);
  if (failedUrls.length) {
    console.log(`Failed: ${failedUrls.join(", ")}`);
  }

  return allDocs;
}
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/loader.ts
git commit -m "feat: add document loader module"
```

---

### Task 4: Document Splitter

**Files:**
- Create: `src/splitter.ts`

**Consumes:** `CONFIG` from `src/config.ts`, `Document` from `@langchain/core/documents`
**Produces:** `splitDocuments(docs: Document[]): Promise<Document[]>`

- [ ] **Step 1: Write `src/splitter.ts`**

```typescript
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import { CONFIG } from "./config";

export async function splitDocuments(docs: Document[]): Promise<Document[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CONFIG.CHUNK_SIZE,
    chunkOverlap: CONFIG.CHUNK_OVERLAP,
    separators: ["\n## ", "\n### ", "\n#### ", "\n", "。", ".", " "],
  });

  const chunks = await splitter.splitDocuments(docs);
  console.log(`Split ${docs.length} documents into ${chunks.length} chunks`);
  return chunks;
}
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/splitter.ts
git commit -m "feat: add document splitter module"
```

---

### Task 5: Vector Store with Persistence

**Files:**
- Create: `src/vectorstore.ts`

**Consumes:** `CONFIG` from `src/config.ts`, `Document` from `@langchain/core/documents`
**Produces:**
- `createEmbeddings(): OpenAIEmbeddings`
- `existsStoredDocs(): Promise<boolean>`
- `saveDocs(docs: Document[]): Promise<void>`
- `loadDocs(): Promise<Document[]>`
- `createVectorStore(docs: Document[]): Promise<MemoryVectorStore>`

- [ ] **Step 1: Write `src/vectorstore.ts`**

```typescript
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import fs from "fs/promises";
import { CONFIG } from "./config";

export function createEmbeddings(): OpenAIEmbeddings {
  return new OpenAIEmbeddings({
    modelName: CONFIG.MODEL_NAME,
    configuration: {
      baseURL: CONFIG.MODEL_BASE_URL,
    },
  });
}

export async function existsStoredDocs(): Promise<boolean> {
  try {
    await fs.access(CONFIG.DOCS_JSON_PATH);
    return true;
  } catch {
    return false;
  }
}

export async function saveDocs(docs: Document[]): Promise<void> {
  const serializable = docs.map((doc) => ({
    pageContent: doc.pageContent,
    metadata: doc.metadata,
  }));
  await fs.writeFile(CONFIG.DOCS_JSON_PATH, JSON.stringify(serializable, null, 2), "utf-8");
  console.log(`Saved ${docs.length} chunks to ${CONFIG.DOCS_JSON_PATH}`);
}

export async function loadDocs(): Promise<Document[]> {
  const raw = await fs.readFile(CONFIG.DOCS_JSON_PATH, "utf-8");
  const items = JSON.parse(raw) as Array<{ pageContent: string; metadata: Record<string, any> }>;
  return items.map((item) => new Document({ pageContent: item.pageContent, metadata: item.metadata }));
}

export async function createVectorStore(docs: Document[]): Promise<MemoryVectorStore> {
  const embeddings = createEmbeddings();
  console.log("Creating vector store with embeddings...");
  const store = await MemoryVectorStore.fromDocuments(docs, embeddings);
  console.log(`Vector store created with ${docs.length} documents`);
  return store;
}

export async function loadVectorStore(): Promise<MemoryVectorStore> {
  const docs = await loadDocs();
  return createVectorStore(docs);
}
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/vectorstore.ts
git commit -m "feat: add vector store with JSON persistence"
```

---

### Task 6: RAG Chain (LCEL)

**Files:**
- Create: `src/chain.ts`

**Consumes:** `CONFIG` from `src/config.ts`, `MemoryVectorStore`, `HumanMessage`/`AIMessage`
**Produces:**
- `createLLM(): ChatOpenAI`
- `createRagChain(vectorStore: MemoryVectorStore): RunnableSequence`
- `formatChatHistory(messages: BaseMessage[]): string`

- [ ] **Step 1: Write `src/chain.ts`**

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { formatDocumentsAsString } from "langchain/util/document";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { CONFIG } from "./config";

const SYSTEM_PROMPT = `You are a helpful assistant that answers questions about LangChain.js.
Use the following retrieved context to answer the question.
If you don't know the answer, say so. Keep answers concise.

Sources:
{context}`;

export function createLLM(): ChatOpenAI {
  return new ChatOpenAI({
    modelName: CONFIG.MODEL_NAME,
    configuration: {
      baseURL: CONFIG.MODEL_BASE_URL,
    },
    temperature: 0.3,
    streaming: true,
  });
}

export function formatChatHistory(messages: BaseMessage[]): string {
  return messages
    .map((m) => {
      const role = m instanceof HumanMessage ? "User" : "Assistant";
      return `${role}: ${m.content}`;
    })
    .join("\n");
}

export async function createRagChain(vectorStore: MemoryVectorStore) {
  const llm = createLLM();
  const retriever = vectorStore.asRetriever(CONFIG.RETRIEVAL_K);

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    ["human", "{question}"],
  ]);

  const chain = RunnableSequence.from([
    {
      context: async (input: { question: string; chat_history?: string }) => {
        const docs = await retriever.invoke(input.question);
        return formatDocumentsAsString(docs);
      },
      question: (input: { question: string; chat_history?: string }) => {
        if (input.chat_history) {
          return `Previous conversation:\n${input.chat_history}\n\nCurrent question: ${input.question}`;
        }
        return input.question;
      },
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  return chain;
}
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/chain.ts
git commit -m "feat: add RAG chain with LCEL"
```

---

### Task 7: CLI Entry Point

**Files:**
- Create: `src/index.ts`

**Consumes:** all previous modules
**Produces:** working CLI app

- [ ] **Step 1: Write `src/index.ts`**

```typescript
import readline from "readline";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { loadDocuments } from "./loader";
import { splitDocuments } from "./splitter";
import { existsStoredDocs, saveDocs, loadDocs, createVectorStore, loadVectorStore } from "./vectorstore";
import { createRagChain, formatChatHistory } from "./chain";
import type { MemoryVectorStore } from "langchain/vectorstores/memory";

async function main() {
  console.log("\n=== LangChain RAG Agent ===\n");

  const hasExisting = await existsStoredDocs();
  let vectorStore: MemoryVectorStore;

  if (hasExisting) {
    console.log("Found existing knowledge base. Loading...");
    vectorStore = await loadVectorStore();
    const docs = await loadDocs();
    console.log(`Loaded ${docs.length} indexed chunks.\n`);
  } else {
    console.log("No existing knowledge base. Fetching documents...");
    const rawDocs = await loadDocuments();
    if (rawDocs.length === 0) {
      console.error("Failed to load any documents. Exiting.");
      process.exit(1);
    }
    const chunks = await splitDocuments(rawDocs);
    await saveDocs(chunks);
    vectorStore = await createVectorStore(chunks);
    console.log("Knowledge base ready.\n");
  }

  const ragChain = await createRagChain(vectorStore);
  const chatHistory: BaseMessage[] = [];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('Type your questions about LangChain. Commands: /clear, /stat, /exit\n');

  const ask = () => {
    rl.question("You: ", async (input) => {
      const trimmed = input.trim();

      if (trimmed === "/exit") {
        console.log("Goodbye!");
        rl.close();
        return;
      }

      if (trimmed === "/clear") {
        chatHistory.length = 0;
        console.log("Chat history cleared.\n");
        ask();
        return;
      }

      if (trimmed === "/stat") {
        const docs = await loadDocs();
        console.log(`Knowledge base: ${docs.length} chunks | History: ${chatHistory.length / 2} rounds\n`);
        ask();
        return;
      }

      if (!trimmed) {
        ask();
        return;
      }

      try {
        const historyStr = chatHistory.length > 0
          ? formatChatHistory(chatHistory.slice(-CONFIG.MAX_HISTORY_ROUNDS * 2))
          : undefined;

        chatHistory.push(new HumanMessage(trimmed));

        process.stdout.write("Agent: ");
        const stream = await ragChain.stream({
          question: trimmed,
          chat_history: historyStr,
        });
        let fullAnswer = "";
        for await (const chunk of stream) {
          process.stdout.write(chunk);
          fullAnswer += chunk;
        }
        process.stdout.write("\n\n");

        chatHistory.push(new AIMessage(fullAnswer));
      } catch (err) {
        console.error(`Error: ${(err as Error).message}\n`);
      }

      ask();
    });
  };

  ask();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Test startup (will fail if no DeepSeek running but structure works)**

```bash
npx tsx src/index.ts
```

Expected: attempts to fetch docs. If DeepSeek is not running, will fail at embedding step with connection error (expected).

- [ ] **Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: add CLI entry point with interactive loop"
```

---

### Task 8: Add .gitignore

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Write `.gitignore`**

```
node_modules/
dist/
data/
*.log
.env
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: add .gitignore"
```

---

### Task 9: End-to-End Verification

**Files:** none (verification only)

- [ ] **Step 1: Ensure DeepSeek is running**

Set environment variables if needed:
```bash
export CRSEC_MODEL_BASE_URL="http://your-deepseek-host:port/v1"
export CRSEC_MODEL_NAME="deepseek-chat"
```

- [ ] **Step 2: Run the agent**

```bash
npx tsx src/index.ts
```

Expected output (first run):
```
=== LangChain RAG Agent ===

No existing knowledge base. Fetching documents...
  Fetching: https://js.langchain.com/docs/introduction
    → 5 documents loaded
  ...
Total: X documents from 4 URLs
Split X documents into Y chunks

Creating vector store with embeddings...
Vector store created with Y documents
Knowledge base ready.

Type your questions about LangChain. Commands: /clear, /stat, /exit

You:
```

- [ ] **Step 3: Test a question**

Input: `What is LangChain?`

Expected: streaming answer about LangChain.js.

- [ ] **Step 4: Test `/stat` and `/clear`**

Input: `/stat` → shows chunk count and history rounds
Input: `/clear` → "Chat history cleared."
Input: `/exit` → "Goodbye!"

- [ ] **Step 5: Test second run (persistence)**

Run again:
```bash
npx tsx src/index.ts
```

Expected output:
```
=== LangChain RAG Agent ===

Found existing knowledge base. Loading...
Creating vector store with embeddings...
Loaded Y indexed chunks.

Type your questions about LangChain...
```

(Note: still re-creates embeddings but doesn't re-fetch/re-split)

- [ ] **Step 6: Final commit if any adjustments made**

```bash
git add -A
git commit -m "chore: final adjustments after verification"
```
