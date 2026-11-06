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
