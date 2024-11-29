import { env } from "@/env";
import googleAnalyticsDefinitions from "@/lib/googleAnalytics/googleAnalyticsDefinitions.json";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import * as grpc from '@grpc/grpc-js';
import { format, parse } from "date-fns";
import { GoogleAuth, OAuth2Client } from "google-auth-library";
import { type GoogleAnalyticsReportParameters } from "./reportParametersSchema";

// export enum GoogleAnalyticsDefinitionCategory {
//   ADVERTISING = "ADVERTISING",
//   ECOMMERCE = "ECOMMERCE",
//   EVENT = "EVENT",
//   OTHER = "OTHER",
//   PAGE_SCREEN = "PAGE_SCREEN",
//   PREDICTIVE = "PREDICTIVE",
//   PUBLISHER = "PUBLISHER",
//   REVENUE = "REVENUE",
//   SESSION = "SESSION",
//   USER = "USER",
//   USER_LIFETIME = "USER_LIFETIME"
// }



export type GoogleAnalyticsDefinition = {
  name: string;
  displayName: string;
  description: string;
  visible: boolean;
  dataType?: {
    type: "date";
    dateFormat: "yyyy" | "yyyyMM" | "yyyyMMdd" | "yyyyMMddHH" | "yyyyMMddHHmm";
  };
  // category: GoogleAnalyticsDefinitionCategory;
};

export const oauth2Client = new OAuth2Client({
  clientId: env.GOOGLE_OAUTH_CLIENT_ID,
  clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
});

// Function to set credentials using refresh token
export const setOAuthCredentials = (refreshToken: string) => {
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });
};

// Analytics Data Client from refresh token
export const initializeAnalyticsDataClient = (refreshToken: string) => {
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  const sslCreds = grpc.credentials.createSsl();
  const credentials = grpc.credentials.combineChannelCredentials(
    sslCreds,
    grpc.credentials.createFromGoogleCredential(oauth2Client)
  );
  return new BetaAnalyticsDataClient({
    sslCreds: credentials,
  });
}


const serviceAccountCredentials = JSON.parse(
  Buffer.from(env.VERVE_GA4_SERVICE_ACCOUNT_JSON_BASE64, "base64").toString(),
);

// Verve GA4 Analytics Data Client
const auth = new GoogleAuth({
  credentials: serviceAccountCredentials,
  scopes: "https://www.googleapis.com/auth/analytics.readonly",
});

export const verveGa4AnalyticsDataClient = new BetaAnalyticsDataClient({
  auth,
});

export class GoogleAnalyticsRunReportError extends Error {
  constructor(
    message: string,
    public originalError: unknown,
  ) {
    super(message);
    this.name = "GoogleAnalyticsRunReportError";
  }
}

// Set OAuth2 client as credentials for Analytics

const runGoogleAnalyticsReport = async ({
  parameters,
  propertyId,
  analyticsDataClient,
}: {
  parameters: GoogleAnalyticsReportParameters;
  propertyId: string;
  analyticsDataClient: BetaAnalyticsDataClient;
}) => {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: parameters.dateRanges,
      dimensions: parameters.dimensions,
      metrics: parameters.metrics,
      limit: parameters.limit ?? undefined,
      metricFilter: parameters.metricFilter,
      dimensionFilter: parameters.dimensionFilter,
      orderBys: parameters.orderBys ? [parameters.orderBys] : undefined,
      keepEmptyRows: true,
    });

    return response;
  } catch (error) {
    const message = (error as any).details as string; // This appears to be where the error goes
    throw new GoogleAnalyticsRunReportError(message, error);
  }
};

const parseReportResponse = ({
  response,
}: {
  response: Awaited<ReturnType<typeof runGoogleAnalyticsReport>>;
}) => {
  const columns = [
    ...(response.dimensionHeaders?.map((header) => {
      if (!header.name) {
        throw new Error("Found unnamed dimension column in GA4 response");
      }

      let dataType: "string" | "date" = "string";
      const dimensionDefinition = getGoogleAnalyticsDefinition({
        type: "dimensions",
        name: header.name,
      });
      if (dimensionDefinition.dataType?.type === "date") {
        dataType = "date";
      }

      return {
        name: header.name,
        columnType: "dimension" as const,
        dataType,
      };
    }) ?? []),
    ...(response.metricHeaders?.map((header) => {
      if (!header.name) {
        throw new Error("Found unnamed metric column in GA4 response");
      }
      if (!header.type) {
        throw new Error("Found metric column with no type in GA4 response");
      }
      return {
        name: header.name,
        columnType: "metric" as const,
        dataType: header.type,
      };
    }) ?? []),
  ];

  const rows =
    response.rows?.map((row) => {
      const rowData: Record<string, string | number> = {};

      // Add dimension values based on columns array
      columns
        .filter((col) => col.columnType === "dimension")
        .forEach((col, index) => {
          const value = row.dimensionValues?.[index]?.value;
          if (value === undefined || value === null) {
            throw new Error(`Missing dimension value for column ${col.name}`);
          }

          const dimensionDefinition = getGoogleAnalyticsDefinition({
            type: "dimensions",
            name: col.name,
          });
          if (dimensionDefinition.dataType?.type === "date") {
            const parsedDate = parse(
              value,
              dimensionDefinition.dataType.dateFormat,
              new Date(),
            );
            if (dimensionDefinition.dataType.dateFormat === "yyyy") {
              rowData[col.name] = format(parsedDate, "yyyy");
            } else if (dimensionDefinition.dataType.dateFormat === "yyyyMM") {
              rowData[col.name] = format(parsedDate, "yyyy-MM");
            } else if (dimensionDefinition.dataType.dateFormat === "yyyyMMdd") {
              rowData[col.name] = format(parsedDate, "yyyy-MM-dd");
            } else if (
              dimensionDefinition.dataType.dateFormat === "yyyyMMddHH"
            ) {
              rowData[col.name] = format(parsedDate, "yyyy-MM-dd HH:00:00");
            } else if (
              dimensionDefinition.dataType.dateFormat === "yyyyMMddHHmm"
            ) {
              rowData[col.name] = format(parsedDate, "yyyy-MM-dd HH:mm:00");
            } else {
              throw new Error(
                `Unimplemented date format in GA4 response: ${dimensionDefinition.dataType.dateFormat}`,
              );
            }
          } else {
            rowData[col.name] = value;
          }
        });

      // Add metric values based on columns array
      columns
        .filter((col) => col.columnType === "metric")
        .forEach((col, index) => {
          const value = row.metricValues?.[index]?.value;
          if (value === undefined || value === null) {
            throw new Error(`Missing metric value for column ${col.name}`);
          }
          if (col.dataType === "TYPE_INTEGER") {
            rowData[col.name] = parseInt(value);
          } else if (col.dataType === "TYPE_FLOAT") {
            rowData[col.name] = parseFloat(value);
          } else {
            // Add these as they appear
            // https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/MetricType
            throw new Error("Unimplemented metric data type in GA4 response.");
            // rowData[col.name] = value;
          }
        });

      return rowData;
    }) ?? [];

  return {
    columns,
    rows,
    rawResponse: response,
  };
};

export const executeGoogleAnalyticsReport = async ({
  parameters,
  propertyId,
  analyticsDataClient,
}: {
  parameters: GoogleAnalyticsReportParameters;
  propertyId: string;
  analyticsDataClient: BetaAnalyticsDataClient;
}) => {
  const response = await runGoogleAnalyticsReport({
    parameters,
    propertyId,
    analyticsDataClient,
  });
  return parseReportResponse({ response });
};

export async function getReportingMetadata({
  propertyId,
  analyticsDataClient,
}: {
  propertyId: string;
  analyticsDataClient: BetaAnalyticsDataClient;
}) {
  const [response] = await analyticsDataClient.getMetadata({
    name: `properties/${propertyId}/metadata`,
  });
  return response;
}

export const getGoogleAnalyticsDefinition = ({
  type,
  name,
}: {
  type: "metrics" | "dimensions";
  name: string;
}) => {
  const definition = googleAnalyticsDefinitions[type].find(
    (def) => def.name === name,
  );
  if (!definition) {
    throw new Error(
      `Google Analytics definition not found for ${type} ${name}`,
    );
  }

  // Sorry for the cast here, for some reason the type checker is not inferring the type correctly
  return definition as GoogleAnalyticsDefinition;
};
