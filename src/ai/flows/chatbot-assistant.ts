'use server';

/**
 * @fileOverview A chatbot assistant for answering questions about the application and Landmark University.
 *
 * - askQuestion - A function that answers questions about the application.
 * - AskQuestionInput - The input type for the askQuestion function.
 * - AskQuestionOutput - The return type for the askQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {supabase} from '@/lib/supabaseClient';
import type {Resource} from '@/lib/mock-data';
import universityInfo from './university-info.json';
import appInfo from './app-info.json';


// Tool for the AI to search for academic resources
const searchResourcesTool = ai.defineTool(
  {
    name: 'searchResources',
    description: 'Search for academic resources like lecture notes, textbooks, and research papers based on a query.',
    inputSchema: z.object({
      query: z.string().describe('The search query, e.g., "quantum physics notes", "calculus textbook", "papers by Dr. Smith"'),
    }),
    outputSchema: z.array(
      z.object({
        name: z.string(),
        type: z.string(),
        course: z.string(),
        year: z.number(),
        description: z.string(),
      })
    ),
  },
  async ({query}) => {
    console.log(`[Tool] searchResources called with query: "${query}"`);
    const {data, error} = await supabase
      .from('resources')
      .select('name, type, course, year, description')
      .textSearch('fts', query, {type: 'websearch'}); // Using fts for better search

    if (error) {
      console.error('[Tool Error] Failed to search resources:', error.message);
      return []; // Return empty on error
    }
    return data as Omit<Resource, 'id'>[];
  }
);


const AskQuestionInputSchema = z.object({
  question: z.string().describe('The question to ask the chatbot about the application or Landmark University.'),
});
export type AskQuestionInput = z.infer<typeof AskQuestionInputSchema>;

const AskQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the question.'),
});
export type AskQuestionOutput = z.infer<typeof AskQuestionOutputSchema>;

export async function askQuestion(input: AskQuestionInput): Promise<AskQuestionOutput> {
  return askQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'askQuestionPrompt',
  input: {schema: AskQuestionInputSchema},
  output: {schema: AskQuestionOutputSchema},
  tools: [searchResourcesTool], // Provide the tool to the AI
  prompt: `You are a helpful and knowledgeable academic assistant for Landmark University.
Your purpose is to answer questions from students and faculty.

You have access to two main sources of information:
1.  **General University Information**: Details about the university's history, contacts, courses, etc. This is your primary knowledge base for general questions.
2.  **A Tool to Search Academic Resources**: You can use the 'searchResources' tool to find specific lecture notes, textbooks, and papers available in the university's resource hub.

**Your instructions:**
*   Be friendly, professional, and encouraging.
*   If the user asks a general question about the university (e.g., "when was it founded?", "what courses are in the computer science department?"), use the provided "University Information" below.
*   If the user asks to find academic materials (e.g., "find me notes on calculus", "are there any textbooks for PHY301?"), you MUST use the 'searchResources' tool.
*   When presenting search results from the tool, format them clearly in a list. If no results are found, say so politely.
*   If you don't know the answer or cannot find it, say "I'm sorry, I don't have that information right now." Do not make things up.
*   You also have information about the application's features if asked.

---
**University Information:**
\`\`\`json
{{{universityInfo}}}
\`\`\`

**Application Features:**
{{{appInfo.features}}}
---

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
      universityInfo: JSON.stringify(universityInfo, null, 2), // Pass the JSON as a string
      appInfo,
    });
    return output!;
  }
);
