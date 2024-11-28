
export type GoogleAnalyticsProperty = {
  propertyId: string;
  name: string;
};

export type GoogleAnalyticsAccount = {
  accountId: string;
  name: string;
  properties: GoogleAnalyticsProperty[];
};
