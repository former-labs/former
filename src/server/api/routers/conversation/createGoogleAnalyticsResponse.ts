import { createGoogleAnalyticsReportResponse } from "./createGoogleAnalyticsReportResponse";
import { createGoogleAnalyticsSegmentationResponse } from "./createGoogleAnalyticsSegmentationResponse";

export const createGoogleAnalyticsResponse = async ({
  workspaceId,
  propertyId,
  conversationId,
  userMessage,
  questionType,
}: {
  workspaceId: string;
  propertyId: string;
  conversationId: string;
  userMessage: string;
  questionType: "report" | "segmentation";
}) => {
  if (questionType === "report") {
    return createGoogleAnalyticsReportResponse({
      workspaceId,
      conversationId,
      userMessage,
    });
  } else {
    return createGoogleAnalyticsSegmentationResponse({
      workspaceId,
      propertyId,
      conversationId,
      userMessage,
    });
  }
};
