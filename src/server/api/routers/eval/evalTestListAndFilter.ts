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

export const evalTestDate = new Date("2024-11-03");

export const evalTestList: EvalApiTest[] = [
  {
    id: "1",
    title: "Test 1", 
    description: "Test 1 description",
    inputPrompt: "Test 1 input prompt",
    targetSql: "Select 1",
  },
] as const;
