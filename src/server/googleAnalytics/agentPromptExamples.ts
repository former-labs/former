
export const AGENT_EXAMPLE_1 = `
<USER_REQUEST>
How many users did the website get in the last 90 days?
</USER_REQUEST>

<MODEL_RESPONSE>
{
  metrics: [ { name: 'activeUsers', expression: null } ],
  dimensions: [],
  dateRanges: [ { startDate: '90daysAgo', endDate: 'today', name: null } ],
  metricFilterAndGroup: null,
  metricFilterOrGroup: null,
  metricFilterNotExpression: null,
  dimensionFilterAndGroup: null,
  dimensionFilterOrGroup: null,
  dimensionFilterNotExpression: null,
  orderBys: null,
  limit: null
}
</MODEL_RESPONSE>
`;

export const AGENT_EXAMPLE_2 = `
<USER_REQUEST>
What's our bounce rate for the past week?
</USER_REQUEST>

<MODEL_RESPONSE>
{
  metrics: [ { name: 'bounceRate', expression: null } ],
  dimensions: [ { name: 'date' } ],
  dateRanges: [ { startDate: '7daysAgo', endDate: 'today', name: null } ],
  metricFilterAndGroup: null,
  metricFilterOrGroup: null,
  metricFilterNotExpression: null,
  dimensionFilterAndGroup: null,
  dimensionFilterOrGroup: null,
  dimensionFilterNotExpression: null,
  orderBys: {
    metric: null,
    dimension: { dimensionName: 'date', orderType: 'ALPHANUMERIC' },
    desc: true
  },
  limit: null
}
</MODEL_RESPONSE>
`;

export const AGENT_EXAMPLE_3 = `
<USER_REQUEST>
How many sessions occurred on the weekend?
</USER_REQUEST>

<MODEL_RESPONSE>
{
  "metrics": [
    {
      "name": "sessions",
      "expression": null
    }
  ],
  "dimensions": [
    {
      "name": "dayOfWeekName"
    }
  ],
  "dateRanges": [
    {
      "startDate": "30daysAgo",
      "endDate": "today",
      "name": null
    }
  ],
  "metricFilterAndGroup": null,
  "metricFilterOrGroup": null,
  "metricFilterNotExpression": null,
  "dimensionFilterAndGroup": [
    {
      "fieldName": "dayOfWeekName",
      "stringFilter": null,
      "inListFilter": {
        "values": [
          "Saturday",
          "Sunday"
        ],
        "caseSensitive": false
      },
      "numericFilter": null,
      "betweenFilter": null
    }
  ],
  "dimensionFilterOrGroup": null,
  "dimensionFilterNotExpression": null,
  "orderBys": null,
  "limit": null
}
</MODEL_RESPONSE>
`;

export const AGENT_EXAMPLE_4 = `
<USER_REQUEST>
How many returning users so far this quarter?
</USER_REQUEST>

<MODEL_RESPONSE>
{
  "metrics": [
    {
      "name": "activeUsers",
      "expression": null
    }
  ],
  "dimensions": [
    {
      "name": "newVsReturning"
    }
  ],
  "dateRanges": [
    {
      "startDate": "2024-10-01",
      "endDate": "today",
      "name": null
    }
  ],
  "metricFilterAndGroup": null,
  "metricFilterOrGroup": null,
  "metricFilterNotExpression": null,
  "dimensionFilterAndGroup": [
    {
      "fieldName": "newVsReturning",
      "stringFilter": {
        "matchType": "EXACT",
        "value": "returning",
        "caseSensitive": false
      },
      "inListFilter": null,
      "numericFilter": null,
      "betweenFilter": null
    }
  ],
  "dimensionFilterOrGroup": null,
  "dimensionFilterNotExpression": null,
  "orderBys": null,
  "limit": null
}
</MODEL_RESPONSE>
`;
