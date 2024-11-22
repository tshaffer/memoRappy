import { openai } from '../index';
import { Request, Response } from 'express';
import ItemOrderedModel from '../models/ItemOrdered';

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002", // Embedding model
      input: texts, // Pass the entire array of texts
    });

    const embeddings: number[][] = response.data.map((data) => data.embedding);
    return embeddings;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw error;
  }
}

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

const similarityThreshold = 0.93;

export async function findBestMatch(inputName: string): Promise<string> {
  try {
    // Step 1: Fetch all items from the database
    const allItems = await ItemOrderedModel.find({}).exec();

    // Step 2: Generate embedding for inputName
    const inputEmbeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: inputName,
    });
    const inputEmbedding = inputEmbeddingResponse.data[0].embedding;

    if (allItems.length === 0) {
      // If no items exist, add inputName as a new standardizedName with its embedding
      const newItem = new ItemOrderedModel({
        inputName,
        standardizedName: inputName,
        embedding: inputEmbedding, // Save the embedding
      });
      await newItem.save();
      return inputName; // No match, treated as new
    }

    // Step 3: Compute similarity scores
    const similarities = allItems.map((item) => {
      if (item.embedding) {
        // Use existing embedding
        return {
          item,
          similarity: cosineSimilarity(inputEmbedding, item.embedding),
        };
      } else {
        return {
          item,
          similarity: 0, // Placeholder if no embedding is available
        };
      }
    });

    // Step 4: Find the best match
    const bestMatch = similarities.reduce((best, current) =>
      current.similarity > best.similarity ? current : best
    );

    // Step 5: Compare against threshold
    if (bestMatch.similarity >= similarityThreshold) {
     
      console.log("Match found:");
      console.log("Input Name:", inputName);
      console.log("Best Match:", bestMatch.item.standardizedName);
      console.log("Similarity:", bestMatch.similarity);

      // Add the inputName and matched standardizedName to the database
      const matchedItem = new ItemOrderedModel({
        inputName,
        standardizedName: bestMatch.item.standardizedName, // Use the matched standardizedName
        embedding: inputEmbedding, // Save the embedding for the inputName
      });
      await matchedItem.save();

      return bestMatch.item.standardizedName; // Return the matched standardizedName
    }

    // Step 6: Add as a new standardizedName if no match
    const newItem = new ItemOrderedModel({
      inputName,
      standardizedName: inputName,
      embedding: inputEmbedding, // Save the embedding
    });
    await newItem.save();
    return inputName; // Treated as new
  } catch (error) {
    console.error("Error finding best match:", error);
    throw error;
  }
}

