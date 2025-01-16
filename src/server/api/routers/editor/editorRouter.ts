import { getEditorSelectionContent } from "@/lib/editorHelpers";
import { getAIChatStructuredResponse, getAIChatTextResponse } from "@/server/ai/openai";
import { createTRPCRouter, publicProcedure, workspaceProtectedProcedure } from "@/server/api/trpc";
import type { DatabaseMetadata } from "@/types/connections";
import { databaseMetadataSchema } from "@/types/connections";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { z } from "zod";


export const editorRouter = createTRPCRouter({
  submitMessage: workspaceProtectedProcedure
    .input(z.object({
      messages: z.array(z.discriminatedUnion("type", [
        z.object({
          type: z.literal("user"),
          content: z.string(),
          editorSelectionContent: z.string().nullable(),
        }),
        z.object({
          type: z.literal("assistant"), 
          content: z.string(),
          knowledgeSources: z.array(z.object({
            key: z.number(),
            knowledgeSourceIds: z.array(z.string()),
          })),
        })
      ])).min(1),
      editorContent: z.string(),
      editorSelectionContent: z.string().nullable(),
      databaseMetadata: databaseMetadataSchema,
      knowledge: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        query: z.string(),
        workspaceId: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }))
    }))
    .mutation(async ({ input }) => {
      // For now, just log the editor content and database metadata
      console.log("Editor content received:", input.editorContent);
      console.log("Editor selection content received:", input.editorSelectionContent);
      console.log("Database metadata received:", input.databaseMetadata);
      console.log("Knowledge base items received:", input.knowledge);

      const { formattedPrompt: knowledgePrompt, knowledgeLookup } = formatKnowledge(input.knowledge);

      const systemMessage: ChatCompletionMessageParam = {
        role: "system",
        content: `
You are a SQL assistant for the AI-first SQL IDE called "Former".

The user is writing SQL code in the editor.
They may ask you a question, or they may ask you to modify the code.
Please respond appropriately based on the user's request.

To help you write queries, you must adhere to the below database schema.
Do not generate SQL code that is not for the provided database schema.

If the user refers to an object that does not in the provided database schema (called the AI schema context),
suggest that they should check it is included in the AI schema context using the checkboxes in the schema explorer.

If they persist and ask you to write it regardless, you can generate it, however you should include
comments in places where you are unsure of the schema.

When generating SQL code, you should copy their code style.

${formatDatabaseMetadata(input.databaseMetadata)}

As a reference, the user has provided some example queries that have been used in the past on the same schema.
You should refer to these when writing your own SQL code.

${knowledgePrompt}

The user's current SQL code in their editor is below:
\`\`\`sql
${input.editorContent}
\`\`\`

${input.editorSelectionContent ? `
The user has also highlighted a section of the code in their editor.
The request they are making is likely related to this highlighted code, so you should take this into account.
\`\`\`sql
${input.editorSelectionContent}
\`\`\`
` : ''}

Respond in Markdown format.
        `
      }

      // Get AI response
      const aiResponse = await getAIChatStructuredResponse({
        messages: [
          systemMessage,
          ...formatChatMessages(input.messages)
        ],
        schemaOutput: z.object({
          response: z.string().describe(`
The response to the user's request, in Markdown format.

If you are responding with SQL code, you should include it in a SQL code block.
You should also give each SQL query a unique numeric key, starting from 1 and incrementing by 1 for each query in the response.
Include this key as a comment on the first line of the SQL code block in the same format as the example below.

For example, if your response contained the following SQL code, you should include the following comment on the first line:
\`\`\`sql
--- key: 1
select
  foo,
  bar
from my_table;
\`\`\`

If you had another SQL block it would start with the line \`--- key: 2\`, etc.
          `),
          knowledgeSources: z.array(z.object({
            key: z.number().describe(`
The key of the SQL query.
This is specified on the first line of the SQL code block as a comment.
e.g. \`--- key: 1\` would give a key of 1.
            `),
            knowledgeSourceIds: z.array(z.number()).describe(`
A list of IDs which represent the IDs of the knowledge queries that were used to generate the response.
e.g. If EXAMPLE_QUERY_1 was relevant, you would include 1 in the list.

If you wrote some SQL and used some knowledge queries to help you, include them here.

For example, if you were asked for "the total revenue for each product" for an ecommerce database, you might want 
to include references to knowledge queries that contained revenue calculations if you used them in your own queries.

If you did not use any knowledge sources, return an empty array.
            `)
          })).describe(`
The knowledge sources for each SQL query.
          `)
        }),
      });

      // Validate the knowledge sources from the response
      const knowledgeSources = aiResponse.knowledgeSources.map(source => ({
        key: source.key,
        knowledgeSourceIds: source.knowledgeSourceIds.map(id => knowledgeLookup(id))
      }));

      return {
        message: {
          type: "assistant" as const,
          content: aiResponse.response,
          // knowledgeSources: knowledgeSources.flatMap(k => k.knowledgeSourceIds),
          knowledgeSources: knowledgeSources,
        }
      };
    }),

  applyChange: workspaceProtectedProcedure
    .input(z.object({
      editorContent: z.string(),
      applyContent: z.string(),
      messages: z.array(z.discriminatedUnion("type", [
        z.object({
          type: z.literal("user"),
          content: z.string(),
          editorSelectionContent: z.string().nullable(),
        }),
        z.object({
          type: z.literal("assistant"), 
          content: z.string(),
          knowledgeSources: z.array(z.object({
            key: z.number(),
            knowledgeSourceIds: z.array(z.string()),
          })),
        })
      ])).min(1),
    }))
    .mutation(async ({ input }) => {
      const initialSystemMessage: ChatCompletionMessageParam = {
        role: "system",
        content: `
You are a SQL assistant. You will apply the provided changes to the SQL code.
Please output only the final SQL code with the changes applied to the original SQL code.

Make sure you fully apply the changes to the original SQL code so that it perfectly matches the target changes.

If the changes only apply to a subsection of the SQL code, please ensure you contain the full code in your response
and modify only the relevant part of the code.

Feel free to use SQL comments to act as shorthand for sections of the code you are not modifying.
e.g. -- Existing query that does X goes here

<EXAMPLE>
An example of how you should apply the changes is below:

<EXAMPLE_INPUT>
Original SQL code:
\`\`\`sql
select
  foo
from my_table;
\`\`\`

Changes to apply:
\`\`\`sql
  foo as bar
\`\`\`
</EXAMPLE_INPUT>

<EXAMPLE_OUTPUT>
select
  foo as bar
from my_table;
</EXAMPLE_OUTPUT>
</EXAMPLE>`
      }

      const finalSystemMessage: ChatCompletionMessageParam = {
        role: "system",
        content: `
The user has asked you to apply the following changes to the SQL code:

Original SQL code:
\`\`\`sql
${input.editorContent}
\`\`\`

Changes to apply:
\`\`\`sql
${input.applyContent}
\`\`\`
        `
      }

      // Get AI response
      const aiResponse = await getAIChatStructuredResponse({
        model: "gpt-4o-mini",
        messages: [
          initialSystemMessage,
          ...formatChatMessages(input.messages),
          finalSystemMessage
        ],
        schemaOutput: z.object({
          sql: z.string().describe(`The final SQL code with changes applied. Output as pure SQL without any Markdown \`\`\` formatting.`)
        }),
      });

      return aiResponse.sql;
    }),

  inlineEdit: workspaceProtectedProcedure
    .input(z.object({
      userMessage: z.string(),
      editorContent: z.string(),
      editorSelection: z.object({
        startLineNumber: z.number(),
        endLineNumber: z.number(),
      }),
      databaseMetadata: databaseMetadataSchema,
      knowledge: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        query: z.string(),
        workspaceId: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }))
    }))
    .mutation(async ({ input }) => {
      // For now, just log the editor content and database metadata
      console.log("User message received:", [input.userMessage]);
      console.log("Editor content received:", [input.editorContent]);
      console.log("Editor selection received:", input.editorSelection, [getEditorSelectionContent({
        editorSelection: input.editorSelection,
        editorContent: input.editorContent
      })]);
      // console.log("Database metadata received:", input.databaseMetadata);
      // console.log("Knowledge base items received:", input.knowledge);

      const systemMessage: ChatCompletionMessageParam = {
        role: "system",
        content: `
You are a SQL assistant that makes changes to the user's SQL editor content.

The user is writing SQL code in the editor.
They have requested that you edit the code in their editor.
If the change does not make sense, you can ignore it and just return the entire original editor content.

When generating SQL code, you should copy the code style in their editor.
It should appear like a natural modification to the existing editor SQL.

To help you write queries, you must adhere to the below database schema.
Do not generate SQL code that is not for the provided database schema.

If they persist and ask you to write it regardless, you can generate it, however you should include
comments in places where you are unsure of the schema.

${formatDatabaseMetadata(input.databaseMetadata)}

As a reference, the user has provided some example queries that have been used in the past on the same schema.
You should refer to these when writing your own SQL code.

${formatKnowledge(input.knowledge).formattedPrompt}

<EXAMPLE_1>
An example of how you might apply the user's request is below.
Note that we have only responsed with code to replace the SQL that was selected.
The rest of the code will remain unchanged and you should not output it.

<EXAMPLE_INPUT>
<USER_REQUEST>
make this also select bar
</USER_REQUEST>

<EXAMPLE_EDITOR_CONTENT>
select\n  foo\nfrom my_table;\n\nselect\n  *\nfrom my_other_table;\n
</EXAMPLE_EDITOR_CONTENT>

<EXAMPLE_EDITOR_SELECTION>
select\n  foo\nfrom my_table;\n\n
</EXAMPLE_EDITOR_SELECTION>

<EXAMPLE_OUTPUT>
select\n  foo,\n  bar\nfrom my_table;\n\n
</EXAMPLE_OUTPUT>
</EXAMPLE_1>

<EXAMPLE_2>
Another example is below.
Note how we output the entire line, including the trailing newline at the end, like "  foo as bar\n"

<EXAMPLE_INPUT>
<USER_REQUEST>
alias this to bar
</USER_REQUEST>

<EXAMPLE_EDITOR_CONTENT>
select\n  foo\nfrom my_table;\n
</EXAMPLE_EDITOR_CONTENT>

<EXAMPLE_EDITOR_SELECTION>
  foo\n
</EXAMPLE_EDITOR_SELECTION>

<EXAMPLE_OUTPUT>
  foo as bar\n
</EXAMPLE_OUTPUT>
</EXAMPLE_2>


<USER_REQUEST>
Please respond with the entire SQL code with the follow change applied:
<REQUESTED_CHANGE>
${input.userMessage}
</REQUESTED_CHANGE>

The user's current SQL code in their editor is below:
<EDITOR_CONTENT>
${input.editorContent}
</EDITOR_CONTENT>

The user has also highlighted a section of the code in their editor.
The request they are making should only apply to this highlighted code, so you should not modify any other code.
<EDITOR_SELECTION>
${getEditorSelectionContent({
  editorSelection: input.editorSelection,
  editorContent: input.editorContent
})}
</EDITOR_SELECTION>
</USER_REQUEST>

        `
      }

      // Get AI response
      const aiResponse = await getAIChatStructuredResponse({
        messages: [
          systemMessage,
        ],
        schemaOutput: z.object({
          newEditorSelection: z.string().describe(`
SQL code to replace the section of code that was highlighted, with the requested changes applied to it.

Do not surround the SQL code with \`\`\` formatting or XML tags.
Make sure you don't modify the SQL in any way except to satisfy the user's request.

Make sure you output entire lines, including any leading or trailing newline that exists in the original SQL selection.
Look at the examples to see how this works.

DO NOT FORGET ANY TRAILING NEWLINES.
`)
        }),
      });

      return aiResponse.newEditorSelection;
    }),

  getAutocomplete: publicProcedure
    .input(z.object({
      editorContent: z.string(),
      editorContentBeforeCursor: z.string(),
      databaseMetadata: databaseMetadataSchema,
    }))
    .mutation(async ({ input }) => {
      /*
        TODO: Add more assistance values to help the AI do less processing.
      */
      const editorContentAfterCursor = input.editorContent.slice(input.editorContentBeforeCursor.length);

      const systemMessage: ChatCompletionMessageParam = {
        role: "system",
        content: `
You are autocompleting SQL code.

To help you write queries, you must adhere to the below database schema.
Do not generate SQL code that is not for the provided database schema.

${formatDatabaseMetadata(input.databaseMetadata)}

In the editor content, the current cursor position is at the location of <REPLACE_ME>.
You need to replace the <REPLACE_ME> with the right SQL.

You need to generate an autocomplete by predicting what characters are likely to exist at the location of <REPLACE_ME>.
Output only the predicted characters to replace <REPLACE_ME>, with no additional formatting or explanation.

Do not just suggest the code that already exists after the cursor <REPLACE_ME> in the editor content.
You must instead guess the SQL code that will likely replace the <REPLACE_ME> symbol in the existing editor content.

Make sure you handle newlines and whitespace carefully.
Look for trailing newlines and whitespace in the content before the cursor.
If you are at the end of a line and you wish to start a new line, you will need to start your autocomplete with a newline character.

If the <REPLACE_ME> cursor is at a location that likely does not need completion, just return nothing.

<EXAMPLE_1>
An example is included below that does likely need autocompletion.

<EDITOR_CONTENT>
select
  foo
fr<REPLACE_ME> my_table;
</EDITOR_CONTENT>

<OUTPUT>
om
</OUTPUT>

Notice how we only output the characters that would replace the <REPLACE_ME> symbol.
</EXAMPLE_1>

<EXAMPLE_2>
An example is included below that does not likely need autocompletion.

<EDITOR_CONTENT>
select
  foo
<REPLACE_ME>from my_table;
</EDITOR_CONTENT>

<OUTPUT>

</OUTPUT>

Notice how we return an empty string.
</EXAMPLE_2>

Respond with only the predicted characters that should replace the <REPLACE_ME> in the editor content.
In most cases, this is a fraction of a single line.
If you are highly certain you can output more than 1 line.

Do NOT say anything else except the predicted characters.
Do NOT surround the predicted characters with \`\`\` or any other formatting.
Only respond with the predicted characters or respond with nothing (empty response).

Make sure you carefully analyse the characters surrounding the <REPLACE_ME> symbol.

The editor content is below:
<EDITOR_CONTENT>
${input.editorContentBeforeCursor}<REPLACE_ME>${editorContentAfterCursor}
<EDITOR_CONTENT>
`
      }

      // console.log("systemMessage", systemMessage);

      const aiResponse = await getAIChatTextResponse({
        // model: "gpt-4o-mini",
        model: "gpt-4o-mini",
        messages: [systemMessage],
        // prediction: input.editorContent,
      });

      return aiResponse;

//       const aiResponse = await getAIChatStructuredResponse({
//         model: "gpt-4o",
//         messages: [systemMessage],
//         schemaOutput: z.object({
//           thoughtProcess: z.string().describe(`
// Write your thought process in a couple sentences.
// Explain where the cursor is and what you think the user is trying to do.
// Then analyse what the user might do next.

// Don't forget your analyse can end with deciding that the user is not in need of a completion.
// `),
//           completion: z.string().describe(`
// The prediction characters, or leave this null if you are not confident about what to predict.
// `).nullable()
//         }),
//       });

//       console.log("aiResponse", aiResponse);

//       if (aiResponse.completion === "\n") {
//         return "";
//       }
//       return aiResponse.completion || "";

    }),

  getKnowledgeComparison: workspaceProtectedProcedure
    .input(z.object({
      newQuery: z.string(),
      sourceQuery: z.string(),
    }))
    .query(async ({ input }) => {
      const { newQuery: newQuery, sourceQuery } = input;

      // Add line numbers to queries
      const numberedNewQuery = newQuery
        .split('\n')
        .map((line, i) => `${i + 1}.${line}`)
        .join('\n');

      const numberedSourceQuery = sourceQuery
        .split('\n')
        .map((line, i) => `${i + 1}.${line}`)
        .join('\n');

      const systemMessage: ChatCompletionMessageParam = {
        role: "system",
        content: `
A new query has been written and the source query may have been used as a reference.
You will compare two SQL queries and figure out and return how the new query was inspired by the source query.
The new query may not have used the source query.

Each query has been provided with line numbers.
You should return the list of line numbers from the new query that appear to be inspired by the source query.
You should also return the line numbers from the source query where this inspiration came from.

<EXAMPLE>
An example response is below:

<EXAMPLE_INPUT>
New query:
\`\`\`sql
1.WITH CustomerSales AS (
2.    SELECT customer_id, SUM(amount) AS total_sales
3.    FROM sales
4.    GROUP BY customer_id
5.)
6.
7.SELECT c.customer_id, c.name, cs.total_sales
8.FROM customers c
9.JOIN CustomerSales cs ON c.customer_id = cs.customer_id
10.ORDER BY cs.total_sales DESC;
\`\`\`

Source query:
\`\`\`sql
1.SELECT customer_id, SUM(amount) AS total_sales
2.FROM sales
3.WHERE YEAR(sale_date) = 2024
4.GROUP BY customer_id
\`\`\`
</EXAMPLE_INPUT>

<EXAMPLE_OUTPUT>
Explanation: The new query uses a group to select customer id and total sales amount, similar to the source query.

New query lines: 2,3,4
Source query lines: 1,2,4
</EXAMPLE_OUTPUT>
</EXAMPLE>

The queries to compare are:

New query:
\`\`\`sql
${numberedNewQuery}
\`\`\`

Source query:
\`\`\`sql
${numberedSourceQuery}
\`\`\`
      `
    };

    const aiResponse = await getAIChatStructuredResponse({
      model: "gpt-4o",
      messages: [systemMessage],
      schemaOutput: z.object({
        similarities: z.string().describe(`
A short description of how the new query was generated from the source query "on the left".
Phrase it as a description of the new query. Keep it relatively short, 1-2 sentences.
        `),
        newQueryLines: z.array(z.number()).describe(`The line numbers from the new query that were inspired by the source query.`),
        sourceQueryLines: z.array(z.number()).describe(`The line numbers from the source query that were used to inspire the new query.`),
      }),
    });

    return aiResponse;
  }),

});

const formatDatabaseMetadata = (metadata: DatabaseMetadata): string => {
  // TODO: Probs just get the CREATE statements for everything? Bc we need foreign keys and stuff like that.
  // SQL just works as a schema definition language.
  return `\
<DATABASE_SCHEMA>
${JSON.stringify(metadata.projects, null, 2)}
</DATABASE_SCHEMA>\
`;
};

const formatKnowledge = (knowledge: Array<{
  id: string;
  name: string;
  description: string;
  query: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}>): {
  formattedPrompt: string;
  knowledgeLookup: (key: number) => string
} => {
  const formattedPrompt = `\
<EXAMPLE_QUERIES>
${knowledge.map((knowledge, index) => `
<EXAMPLE_QUERY_${index + 1}>
ID: ${index + 1}
Title: ${knowledge.name}
Description: ${knowledge.description}

\`\`\`sql
${knowledge.query}
\`\`\`
</EXAMPLE_QUERY_${index + 1}>
`).join("")}
</EXAMPLE_QUERIES>\
`;

  const knowledgeLookup = (key: number): string => {
    const foundKnowledge = knowledge[key - 1];
    if (!foundKnowledge) {
      throw new Error(`Knowledge with index ${key} not found.`);
    }
    return foundKnowledge.id;
  };

  return { formattedPrompt, knowledgeLookup };
};

const formatChatMessages = (messages: Array<{
  type: "user" | "assistant";
  content: string;
  editorSelectionContent?: string | null;
  knowledgeSources?: Array<{
    key: number;
    knowledgeSourceIds: string[];
  }>;
}>): ChatCompletionMessageParam[] => {
  return messages.map(msg => {
    if (msg.type === "assistant") {
      return {
        role: msg.type,
        content: msg.content
      };
    } else {
      if (!msg.editorSelectionContent) {
        return {
          role: msg.type,
          content: msg.content
        }
      } else {
        return {
          role: msg.type,
          content: `\
<MESSAGE_METADATA>
When sending this message, the user had highlighted a section of the code in their editor.
This may be referred to in the current message and any future messages.

\`\`\`sql
${msg.editorSelectionContent}
\`\`\`
</MESSAGE_METADATA>

${msg.content}`
        };
      }
    }
  });
};
