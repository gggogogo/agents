You are a senior backend engineer.

Build a production-ready SDK Documentation RAG system that allows LLM agents (such as Claude Code, Codex, or other agents) to retrieve relevant SDK APIs and use them to generate code.

The system should focus on:

- SDK documentation ingestion
- API-level chunk generation
- embedding index
- vector retrieval
- agent-friendly retrieval API

The goal is to reduce LLM token usage while allowing models to retrieve relevant SDK APIs dynamically.

--------------------------------

SYSTEM REQUIREMENTS

The system must include the following modules:

1. Documentation Ingestion

Load SDK documentation from markdown files.

Example structure:

docs/
  upload.md
  auth.md
  file.md

Parse documentation into structured API definitions:

{
  api_name
  description
  parameters
  example
}

--------------------------------

2. API Chunk Generation

Do NOT use token-based chunking.

Instead generate one chunk per API.

Each chunk must follow this schema:

{
  id: string
  library: string
  type: "function" | "class" | "method"
  name: string
  description: string
  use_cases: string[]
  parameters: object
  example: string
  keywords: string[]
}

--------------------------------

3. Embedding Index

Generate embeddings using OpenAI embeddings.

Store embeddings in a vector database.

Recommended:

pgvector or Qdrant.

Each record should include:

{
  id
  embedding
  metadata
}

--------------------------------

4. Retrieval Service

Implement a REST API using FastAPI.

Endpoint:

POST /rag/search

Request:

{
  query: string
  top_k: number
}

The service must:

- embed the query
- perform vector similarity search
- return top matching SDK APIs

--------------------------------

5. Context Builder

Return results in a format optimized for LLM code generation.

Example output:

{
  results: [
    {
      api_name: "uploadFile",
      description: "Upload a file to server",
      parameters: {
        file: "File",
        onProgress: "callback"
      },
      example: "sdk.uploadFile(file, { onProgress })"
    }
  ]
}

--------------------------------

6. Project Structure

sdk-rag/
  ingestion/
  chunking/
  embeddings/
  retrieval/
  api/
  schemas/

--------------------------------

7. Additional Requirements

- modular architecture
- clear typing
- docstrings
- ability to reindex docs
- simple CLI command for indexing

Example:

python index_docs.py

--------------------------------

The final result should be a working SDK documentation RAG service that can be used by:

- Claude Code
- Codex
- custom AI agents

The service should allow LLMs to dynamically retrieve SDK APIs and use them for code generation.