import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { getAgentResponse } from "@/server/googleAnalytics/getAgentResponse";
import {
  executeGoogleAnalyticsReport,
  getReportingMetadata,
  verveGa4AnalyticsDataClient,
} from "@/server/googleAnalytics/googleAnalytics";
import { googleAnalyticsReportParametersSchema } from "@/server/googleAnalytics/reportParametersSchema";
import { z } from "zod";
import { evalTestList } from "./evalTestListAndFilter";
import { verifyEvalResponse } from "./verifyEvalResponse";

export const evalRouter = createTRPCRouter({
  listEvalTests: publicProcedure
    .input(
      z.object({
        workspaceUid: z.string(),
      }),
    )
    .query(async () => {
      return evalTestList;
    }),

  runEvalTest: publicProcedure
    .input(
      z.object({
        workspaceUid: z.string(),
        evalId: z.enum(evalTestList.map((t) => t.id) as [string, ...string[]]),
      }),
    )
    .mutation(async ({ input }) => {
      const evalTest = evalTestList.find((t) => t.id === input.evalId);
      if (!evalTest) {
        throw new Error("Eval test not found");
      }

      console.log("Running eval test:", evalTest.inputPrompt);

      const agentResponse = await getAgentResponse({
        formattedConversationHistory: [],
        prompt: evalTest.inputPrompt,
      });

      console.log(agentResponse.googleAnalyticsReportParameters);

      const verification = verifyEvalResponse({
        outputQuery: agentResponse.googleAnalyticsReportParameters,
        targetQuery: evalTest.targetParameters,
      });

      return {
        success: verification.success,
        reason: verification.success
          ? "Query matches target parameters"
          : "Query does not match target parameters",
        agentResponse: agentResponse.googleAnalyticsReportParameters,
      };
    }),

  getGoogleAnalyticsReport: publicProcedure
    .input(
      z.object({
        workspaceUid: z.string(),
        parameters: googleAnalyticsReportParametersSchema,
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Hardcoded to ours for now
        const propertyId = "447821713";

        const report = await executeGoogleAnalyticsReport({
          parameters: input.parameters,
          propertyId,
          analyticsDataClient: verveGa4AnalyticsDataClient,
        });
        return {
          success: true as const,
          data: report,
        };
      } catch (error) {
        console.log(error);
        return {
          success: false as const,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    }),

  getGoogleAnalyticsMetadata: publicProcedure
    .input(
      z.object({
        workspaceUid: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        // Hardcoded to ours for now
        const propertyId = "447821713";

        const metadata = await getReportingMetadata({
          propertyId,
          analyticsDataClient: verveGa4AnalyticsDataClient,
        });

        return {
          success: true as const,
          data: metadata,
        };
      } catch (error) {
        return {
          success: false as const,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    }),
});
