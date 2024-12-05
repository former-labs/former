import { createGoogleAnalyticsReportResponse } from "./createGoogleAnalyticsReportResponse";
import { createGoogleAnalyticsSegmentationResponse } from "./createGoogleAnalyticsSegmentationResponse";

export const createGoogleAnalyticsResponse = async ({
  workspaceId,
  propertyId,
  conversationId,
  userMessage,
}: {
  workspaceId: string;
  propertyId: string;
  conversationId: string;
  userMessage: string;
}) => {
  if (true) {
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
