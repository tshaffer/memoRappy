import { openai } from '../index';
import { Request, response, Response } from 'express';

// Function to generate embeddings for a list of texts
async function old_generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const embeddings: number[][] = [];
    for (const text of texts) {
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002", // Embedding model
        input: text,
      });
      embeddings.push(response.data[0].embedding); // Extract embedding vector
    }
    return embeddings;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw error;
  }
}

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    // Use the OpenAI API to embed all texts in a single call
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002", // Embedding model
      input: texts, // Pass the entire array of texts
    });

    // Extract embeddings for all texts from the response
    const embeddings: number[][] = response.data.map((data) => data.embedding);
    return embeddings;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw error;
  }
}

// Function to calculate cosine similarity between two vectors
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Handler function to check similarity
export const checkTextSimilarityHandler: any = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const similarity = await checkTextSimilarity(req.body.text1, req.body.text2);
    res.json(similarity);
  } catch (error) {
    console.error("Error checking similarity:", error);
    throw error;
  }
}

export const checkTextSimilarity: any = async (
  text1: string,
  text2: string,
): Promise<number> => {
  try {
    const embeddings = await generateEmbeddings([text1, text2]);
    const similarity = cosineSimilarity(embeddings[0], embeddings[1]);
     return similarity;
  } catch (error) {
    console.error("Error checking similarity:", error);
    throw error;
  }
}

// Example usage
// (async () => {
//   const text1 = "This is a sample sentence.";
//   const text2 = "This is another example sentence.";
  
//   const similarity = await checkSimilarity(text1, text2);
//   console.log(`Similarity score: ${similarity}`);
// })();
