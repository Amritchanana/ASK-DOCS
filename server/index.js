import express from 'express';
import cors from 'cors';
import multer from 'multer'
import { Queue } from 'bullmq';
import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';
//import  OpenAI  from 'openai';
import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

/* earlier syntax
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
*/

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

const queue = new Queue("file-upload-queue", { connection: redisConfig });


const genAI = new GoogleGenAI({
    apiKey:process.env.GEMINI_API_KEY,
});

//console.log("Queue initialized:", queue);

const storage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, 'uploads/');
    },
    filename: function (req,file,cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random()* 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
})
const upload= multer({ storage: storage });

const app=express();
app.use(cors());

app.get('/', (req,res)=>{
    return res.json({status: 'All Good!' });
})

app.post('/upload/pdf', upload.single('pdf'), async (req, res)=>{
    console.log("File info:", req.file);
    await queue.add('file-ready',JSON.stringify({
        filename:req.file.originalname,
        source: req.file.destination,
        path: req.file.path,
    }));
    return res.json({ message: 'uploaded'})
})

app.get('/chat', async (req,res)=>{
    console.log("hi there");
    const userQuery= req.query.message;
    if (!userQuery) {
        return res.status(400).json({ error: "message query parameter required" });
    };

    const embeddings = new OpenAIEmbeddings({
        model: `text-embedding-3-small`,
        apiKey: process.env.OPENAI_API_KEY,
    });

    const vectorstore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
            url: 'https://19aa4551-ebbf-46ae-bd9b-f104ecc3337a.eu-west-2-0.aws.cloud.qdrant.io',
            apiKey: process.env.QDRANT_API_KEY,
            collectionName: `pdf-collection`,
            vectorName: 'Default'
        }
    );
    const ret = vectorstore.asRetriever({
        k: 6,
    });
    const docs = await ret.invoke(userQuery);

    /*
    const SYSTEM_PROMPT= `
        You are a helpful assistant that helps user query based on the available context from PDF file.
        Context: ${JSON.stringify(docs)}
    `;      // based on rag we have feeded the context.

    const chatResult = await client.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": userQuery},
        ]
    })
    return res.json({
        message: chatResult.choices[0].message.content,
        docs: result,
    });
    */
    // Fix-1 - handling the Unavailable Api 503 error
    /*
    console.log("hi there 2");
    const context = docs
        .map((d, i) => `Chunk ${i + 1}:\n${d.pageContent}`)
        .join("\n\n");
    const prompt = `
        You are a strict PDF question-answering assistant.

        Rules:
        - Answer ONLY using the context
        - Quote or paraphrase directly from it
        - If the answer is missing, reply exactly: Not found in the document

        Context:${context}
        Question:${userQuery}
    `;

    const geminiResponse = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
        {
            role: "user",
            parts: [{ text: prompt }],
        },
        ],
    });

    res.json({
        message: geminiResponse.text,
        docs,
    });
    console.log("hi there 3");
    docs.forEach((d, i) => {
        console.log(`Doc ${i} preview:`, d.pageContent.slice(0, 200));
    });
});
*/

    try {
        console.log("hi there 2");

        const context = docs
            .map((d, i) => `Chunk ${i + 1}:\n${d.pageContent}`)
            .join("\n\n");

        const prompt = `
    You are a strict PDF question-answering assistant.

    Rules:
    - Answer ONLY using the context
    - Quote or paraphrase directly from it
    - If the answer is missing, reply exactly: Not found in the document

    Context:
    ${context}

    Question:
    ${userQuery}
    `;

        const geminiResponse = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }],
                },
            ],
        });

        console.log("hi there 3");

        docs.forEach((d, i) => {
            console.log(`Doc ${i} preview:`, d.pageContent.slice(0, 200));
        });

        res.json({
            message: geminiResponse.text,
            docs,
        });

    } catch (error) {
        console.error("Gemini API Error:", error);

        res.status(500).json({
            error: "Failed to generate response from AI model",
            details: error.message,
        });
    }

});
app.listen(8000, ()=> console.log(`Server started on PORT: 8000`));