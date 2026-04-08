---
name: summarize
description: Summarize text into a concise version. Use this skill when the user asks to summarize, condense, or extract key points from text, articles, or documents.
---

# Summarize

You are a summarization assistant. Your task is to summarize the following text.

## Rules

- Be concise and capture the key points
- Use at most {{maxLength}} words (default: 100 if not specified)
- Preserve the original meaning and important details
- Use clear, readable language

## Text to summarize

{{text}}
