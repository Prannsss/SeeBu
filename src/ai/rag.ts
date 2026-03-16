import { ai } from "./genkit";
import { z } from "zod";

// ============================================================================
// 1. RAG AI Output Schema Definition
// ============================================================================

/**
 * Strictly defined schema that Genkit will force the LLM to follow.
 * Ensures perfect synchronization with typed backend features.
 */
export const DocumentSummarySchema = z.object({
  title: z.string().describe("A concise 3-5 word title summarizing the document."),
  keyPoints: z.array(z.string()).describe("List of 3-5 actionable bullet points."),
  confidenceScore: z.number().min(0).max(100).describe("Confidence metric (0-100) regarding retrieved data relevance."),
  departmentRouting: z.enum(["HR", "IT", "LEGAL", "OPERATIONS"]).describe("Which department should review this document"),
});

export type DocumentSummary = z.infer<typeof DocumentSummarySchema>;

// ============================================================================
// 2. Mock Retrieval Logic (Vector DB / Knowledge Base)
// ============================================================================

async function fetchRelevantDocuments(query: string, userId: string) {
  // Telemetry & Security note: We log the user attempting exactly what retrieval,
  // and we only fetch documents they have access to.
  console.log(`[RAG_RETRIEVE] User: ${userId} | Query: ${query}`);
  
  // Simulated vector retrieval return...
  return [
    "Doc1: The new PTO policy requires at least 2 weeks notice for any leave over 3 days. Managed by HR.",
    "Doc2: All IT equipment must be returned within 48 hours of employment termination."
  ];
}

// ============================================================================
// 3. GenAI RAG Pipeline
// ============================================================================

/**
 * Executes a GenAI flow that retrieves context and generates strictly typed outputs.
 */
export async function generateDocumentSummary(query: string, userId: string): Promise<DocumentSummary> {
  try {
    // 1. Retrieve Context
    const retrievedContext = await fetchRelevantDocuments(query, userId);
    
    // 2. Build secure context prompt
    const contextText = retrievedContext.map((c, i) => `[Context ${i + 1}]: ${c}`).join("\n");
    const fullPrompt = `
      You are an expert internal summarization assistant.
      Use the following retrieved knowledge base documents to answer the query.
      If the context does not answer the query, respond purely based on the context with a low confidence score.

      === RETRIEVED CONTEXT ===
      ${contextText}

      === USER QUERY ===
      ${query}
    `;

    // 3. Execute LLM with forced Schema output
    const response = await ai.generate({
      prompt: fullPrompt,
      output: { schema: DocumentSummarySchema },
    });

    // Output is fully verified against the Zod schema by Genkit natively.
    const result = response.output();
    
    if (!result) {
      throw new Error("AI returned a null or invalid response");
    }

    return result as DocumentSummary;

  } catch (error) {
    console.error("[generateDocumentSummary_ERROR] GenAI pipeline failure:", error);
    throw new Error("Failed to generate summary via RAG pipeline.");
  }
}
