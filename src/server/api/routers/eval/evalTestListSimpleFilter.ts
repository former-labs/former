/*
Official documentation for the metrics/dimensions etc
https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema#metrics

Official documentation for the runReport API
https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport
*/


export type EvalApiTest = {
  id: string;
  title: string;
  description: string;
  inputPrompt: string;
  targetSql: string;
  tags?: string[];
  notes?: string[];
};

export const evalTestList: EvalApiTest[] = [
  {
    id: "1",
    title: "Select 1",
    description: "Select 1",
    inputPrompt: "DO select 1",
    targetSql: "Select 1",
    tags: ["filter", "basic"],
  }
] as const
