'use server';

/**
 * @fileOverview A chatbot assistant for answering questions about the application.
 *
 * - askQuestion - A function that answers questions about the application.
 * - AskQuestionInput - The input type for the askQuestion function.
 * - AskQuestionOutput - The return type for the askQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import appInfo from './app-info.json';

const AppInfoSchema = z.object({
  features: z.array(z.string()),
});

const AskQuestionInputSchema = z.object({
  question: z.string().describe('The question to ask the chatbot about the application.'),
});
export type AskQuestionInput = z.infer<typeof AskQuestionInputSchema>;

const AskQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the question about the application.'),
});
export type AskQuestionOutput = z.infer<typeof AskQuestionOutputSchema>;

export async function askQuestion(input: AskQuestionInput): Promise<AskQuestionOutput> {
  return askQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'askQuestionPrompt',
  input: {schema: AskQuestionInputSchema},
  output: {schema: AskQuestionOutputSchema},
  prompt: `You are a chatbot assistant that answers questions about the application.
  Use the following information about the application to answer the question.
  Application Features: {{{appInfo.features}}}

  Question: {{{question}}}
  Answer:`, 
});

const askQuestionFlow = ai.defineFlow(
  {
    name: 'askQuestionFlow',
    inputSchema: AskQuestionInputSchema,
    outputSchema: AskQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt({
      ...input,
      appInfo,
    });
    return output!;
  }
);
