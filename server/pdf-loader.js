import fs from "fs";
import { Document } from "@langchain/core/documents";

export class PDFLoader {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async load() {
    const buffer = fs.readFileSync(this.filePath);
    const text = buffer.toString(); // crude extraction, or use a PDF library
    return [new Document({ pageContent: text })];
  }
}
