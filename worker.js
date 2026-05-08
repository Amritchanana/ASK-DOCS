import { Worker } from 'bullmq';
import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';
//import { Document } from '@langchain/core/documents';
//import { PDFLoader } from './pdf-loader.js';
import {PDFLoader} from '@langchain/community/document_loaders/fs/pdf';
// import {CharacterTextSplitter} from "@langchain/textsplitters";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import 'dotenv/config';

// Use Upstash Redis URL from environment variable
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisConnection = new URL(redisUrl);
const redisConfig = {
    host: redisConnection.hostname,
    port: parseInt(redisConnection.port) || 6379,
    password: redisConnection.password || undefined,
    tls: {},
    db: redisConnection.pathname ? parseInt(redisConnection.pathname.slice(1)) : 0,
};

console.log("Worker started");
const worker = new Worker(
    'file-upload-queue', async (job) => {
  console.log(`Job:`, job.data);
  const data= JSON.parse(job.data)

    /*
    1) Path: data.path
    2) read the pdf from path, 
    3) chunk the pdf(using text splitter)
    4) call the OpenAi embedding model for every chunk,
    5) store the chunk in qdrant DB
    */

    // load the PDF
    //const loader = new PDFLoader(data.path);
    // const docs = await loader.load(); 
    const loader = new PDFLoader(data.path, {
        splitPages: true,
    });
    const docs = await loader.load();

    console.log("Docs length:", docs.length);
    if (!docs.length) {
        throw new Error("PDF loader returned 0 documents");
    };

    const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1600,
    chunkOverlap: 300,
    });

    const splitDocs = await splitter.splitDocuments(docs);

    console.log("Split docs count:", splitDocs.length);
    if (!splitDocs.length) {
        throw new Error("Text splitter produced 0 chunks");
    };


    // 4th and 5th step : creating embeddings and storing in qdrant
    const embeddings = new OpenAIEmbeddings({
        model: `text-embedding-3-small`,
        apiKey: process.env.OPENAI_API_KEY,
    });
    console.log("Embeddings created");
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
            url: 'https://ccdf3920-4114-46af-8c23-9f919cb9937c.eu-west-2-0.aws.cloud.qdrant.io',
            apiKey: process.env.QDRANT_API_KEY,
            collectionName: `pdf-collection`,
            vectorName: 'Default'
        }
    );

    const BATCH_SIZE = 50;
    for (let i = 0; i < splitDocs.length; i += BATCH_SIZE) {
        const batch = splitDocs.slice(i, i + BATCH_SIZE);
        await vectorStore.addDocuments(batch);
        console.log(`Inserted batch ${i / BATCH_SIZE + 1}`);
    };
    /*try {
        await vectorStore.addDocuments(splitDocs);
        console.log(" Docs successfully added to Qdrant");
    } catch (err) {
        console.error(" Failed to add documents:", err);
        throw err;
    }*/

    /* IGNORE THIS SECTION FOR SOMETIME
    // chunking the pdf
    const textsplitters = new CharacterTextSplitter({
        chunkSize:300,
        chunkOverlap: 0,
    });
    const texts = await textSplitter.splitText(docs);   // it will make "texts"(variable) an array
    console.log(texts); // checking the splitted pdf

    */

    console.log("Job completed successfully");
}, { concurrency: 2, connection: redisConfig }
);
// render free tier issue
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Worker alive');
});

app.listen(PORT, () => {
  console.log(`Worker HTTP server running on ${PORT}`);
});