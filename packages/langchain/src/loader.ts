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
