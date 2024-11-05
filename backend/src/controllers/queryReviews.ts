import { openai } from '../index';
import Review from '../models/Review';

export const queryReviewsHandler: any = async (req: any, res: any): Promise<void> => {
  const { query } = req.body;

  try {
    // Fetch all reviews from MongoDB (or you can apply filters if necessary)
    const reviews = await Review.find().exec();

    if (!reviews.length) {
      return res.status(404).json({ message: 'No reviews found.' });
    }

    // Format the review texts to be sent to ChatGPT
    const reviewsText = reviews.map((review) => `Review: "${review.reviewText}"`).join('\n\n');

    // Formulate the ChatGPT prompt
    const prompt = `
      You are helping a user query restaurant reviews. The user has asked: "${query}".
      Here are the reviews:
      ${reviewsText}
      Based on the reviews, please provide the most relevant response to the user's query.
    `;

    // Send the query and reviews to ChatGPT
    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4", // Adjust based on the version you need
      messages: [
        { role: "system", content: "You're assisting with querying restaurant reviews." },
        { role: "user", content: prompt },
      ],
    });

    // Get the result from ChatGPT
    const messageContent = gptResponse.choices[0].message?.content;
    if (!messageContent) {
      return res.status(500).json({ error: 'Failed to retrieve response from ChatGPT.' });
    }

    // Respond to the client with the ChatGPT response
    res.status(200).json({ result: messageContent });

  } catch (error) {
    console.error('Error querying reviews:', error);
    res.status(500).json({ error: 'An error occurred while querying the reviews.' });
  }
};
