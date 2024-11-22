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
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  const dotProduct = vec1.reduce((sum, val, idx) => sum + val * vec2[idx], 0);
  const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitude1 * magnitude2);
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
