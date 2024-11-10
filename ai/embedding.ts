import { embed, embedMany } from 'ai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { ollama } from 'ollama-ai-provider';
import { removeStopwords } from 'stopword';

export const embeddingModel = ollama.textEmbeddingModel('mxbai-embed-large');

// Clean text
const cleanText = (text: string): string =>
  removeStopwords(
    text
      .replace(/https?:\/\/\S+/g, '') // Remove URLs
      .replace(/[^a-zA-Z0-9\s.,!?-]/g, ' ') // Remove special chars
      .replace(/\s+/g, ' ') // Remove extra whitespace
      .toLowerCase() // Convert to lowercase
      .trim()
      .split(' ')
  ).join(' ');

// Create chunks
const createChunks = async (
  text: string,
  options = {
    chunkSize: 1000,
    chunkOverlap: 200,
  }
): Promise<string[]> => {
  const splitter = new RecursiveCharacterTextSplitter(options);
  const chunks = await splitter.createDocuments([text]);
  return chunks.map((chunk) => chunk.pageContent);
};

// Generate embeddings
export const generateEmbeddings = async (value: string) => {
  const cleaned = cleanText(value);
  const chunks = await createChunks(cleaned);

  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });

  return embeddings.map((e, i) => ({
    content: chunks[i],
    embedding: e,
  }));
};

export const generateEmbedding = async (value: string) => {
  const cleaned = cleanText(value);

  const { embedding } = await embed({
    model: embeddingModel,
    value: cleaned,
  });

  return embedding;
};
