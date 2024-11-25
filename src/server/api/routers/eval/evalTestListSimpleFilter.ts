/*
Official documentation for the metrics/dimensions etc
https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema#metrics

Official documentation for the runReport API
https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport
*/

import { type GoogleAnalyticsReportParametersWithOptionals } from "@/server/googleAnalytics/reportParametersSchemaVariants";

export type EvalApiTest = {
  id: string;
  title: string;
  description: string;
  inputPrompt: string;
  targetParameters: GoogleAnalyticsReportParametersWithOptionals;
  tags?: string[];
  notes?: string[];
};

export const evalTestList: EvalApiTest[] = [
  {
    id: "total-users-30-days",
    title: "Total Users - Last 30 Days",
    description: "How many users did the website get in the last 30 days?",
    inputPrompt: "How many users did the website get in the last 30 days?",
    targetParameters: {
      metrics: [
        {
          name: "activeUsers",
        },
      ],
      dimensions: [],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
    notes: ["✅ Checked with GA4 Reports"],
  },
  {
    id: "returning-users-30-days",
    title: "Returning Users - Last 30 Days",
    description: "How many returning users in the last 30 days?",
    inputPrompt: "How many returning users in the last 30 days?",
    targetParameters: {
      metrics: [
        {
          name: "activeUsers",
        },
      ],
      dimensions: [
        {
          name: "newVsReturning",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "newVsReturning",
          stringFilter: {
            matchType: "EXACT",
            value: "returning",
            caseSensitive: false,
          },
        },
      },
    },
    notes: ["✅ Checked with GA4 Reports"],
  },
  {
    id: "returning-users-90-days",
    title: "Returning Users - Last 90 Days",
    description: "How many returning users in the last 3 months?",
    inputPrompt: "How many returning users in the last 3 months?",
    targetParameters: {
      metrics: [
        {
          name: "activeUsers",
        },
      ],
      dimensions: [
        {
          name: "newVsReturning",
        },
      ],
      dateRanges: [
        {
          startDate: "90daysAgo",
          endDate: "today",
        },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "newVsReturning",
          stringFilter: {
            matchType: "EXACT",
            value: "returning",
            caseSensitive: false,
          },
        },
      },
    },
    notes: [
      "✅ Checked with GA4 Reports",
      "EITHER DATERANGE: [90daysAgo, 2024-08-21]",
    ],
  },
  {
    id: "returning-users-quarterly",
    title: "Returning Users - Quarterly Analysis",
    description: "How many returning users so far this quarter?",
    inputPrompt: "How many returning users so far this quarter?",
    targetParameters: {
      metrics: [
        {
          name: "activeUsers",
        },
      ],
      dimensions: [
        {
          name: "newVsReturning",
        },
      ],
      dateRanges: [
        {
          startDate: (() => {
            const now = new Date();
            const currentMonth = now.getMonth();
            const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
            return new Date(
              now.getFullYear(),
              quarterStartMonth,
              1,
            ).toLocaleDateString("en-CA");
          })(),
          endDate: "today",
        },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "newVsReturning",
          stringFilter: {
            matchType: "EXACT",
            value: "returning",
            caseSensitive: false,
          },
        },
      },
    },
    notes: ["✅ Checked with GA4 Reports"],
  },
  {
    id: "returning-users-daily-trend",
    title: "Returning Users - Daily Trend",
    description: "Segment returning users by day in the last 30 days.",
    inputPrompt: "Segment returning users by day in the last 30 days.",
    targetParameters: {
      metrics: [
        {
          name: "activeUsers",
        },
      ],
      dimensions: [
        {
          name: "date",
        },
        {
          name: "newVsReturning",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "newVsReturning",
          stringFilter: {
            matchType: "EXACT",
            value: "returning",
            caseSensitive: false,
          },
        },
      },
      orderBys: {
        metric: null,
        dimension: {
          dimensionName: "date",
          orderType: "ALPHANUMERIC",
        },
        desc: false,
      },
    },
    notes: ["✅ Checked with GA4 Reports"],
  },
  {
    id: "german-users-30-days",
    title: "German Users - Last 30 Days",
    description: "How many users in the last 30 days were from Germany?",
    inputPrompt: "How many users in the last 30 days were from Germany?",
    targetParameters: {
      metrics: [
        {
          name: "activeUsers",
        },
      ],
      dimensions: [
        {
          name: "country",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "country",
          stringFilter: {
            matchType: "EXACT",
            value: "Germany",
            caseSensitive: false,
          },
        },
      },
    },
    notes: ["✅ Checked with GA4 Reports"],
  },
  {
    id: "organic-sessions-october-yoy",
    title: "Organic Sessions - October YoY Comparison",
    description: "Compare organic sessions for October 2024 YoY",
    inputPrompt: "Compare organic sessions for October 2024 YoY",
    targetParameters: {
      metrics: [
        {
          name: "sessions",
        },
      ],
      dimensions: [
        {
          name: "sessionDefaultChannelGroup",
        },
      ],
      dateRanges: [
        {
          startDate: "2024-10-01",
          endDate: "2024-10-31",
          name: "October 2024",
        },
        {
          startDate: "2023-10-01",
          endDate: "2023-10-31",
          name: "October 2023",
        },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "sessionDefaultChannelGroup",
          stringFilter: {
            matchType: "EXACT",
            value: "Organic Search",
            caseSensitive: false,
          },
        },
      },
    },
    notes: [
      "❓ Seems right? Not sure about using defaultChannelGroup instead of sessionDefaultChannelGroup",
      "Can't check with GA4 Reports because no March 2023/2024 data",
    ],
  },
  {
    id: "engaged-sessions-october-yoy",
    title: "Engaged Sessions - October YoY Comparison",
    description: "Compare all engaged sessions for October 2024 YoY",
    inputPrompt: "Compare all engaged sessions for October 2024 YoY",
    targetParameters: {
      metrics: [
        {
          name: "engagedSessions",
        },
        {
          name: "sessions",
          optional: true,
        },
      ],
      dimensions: [
        {
          name: "year",
        },
      ],
      dateRanges: [
        {
          startDate: "2024-10-01",
          endDate: "2024-10-31",
          name: "current_year",
        },
        {
          startDate: "2023-10-01",
          endDate: "2023-10-31",
          name: "previous_year",
        },
      ],
    },
    notes: [
      "❓ Seems right? Not sure about using defaultChannelGroup instead of sessionDefaultChannelGroup",
      "Can't check with GA4 Reports because no October 2023/2024 data",
      "SOMETIMES GIVES 'date' DIMENSION INSTEAD OF 'yearMonth' DIMENSION",
    ],
  },
  {
    id: "mom-user-comparison",
    title: "Month-over-Month User Comparison",
    description: "How are we comparing this month to last month for users?",
    inputPrompt: "How are we comparing this month to last month for users?",
    targetParameters: {
      metrics: [
        {
          name: "activeUsers",
        },
      ],
      dimensions: [],
      dateRanges: [
        {
          startDate: new Date(
            new Date().getFullYear(),
            new Date().getMonth() - 1,
            1,
          ).toLocaleDateString("en-CA"),
          endDate: new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            0,
          ).toLocaleDateString("en-CA"),
          name: "lastMonth",
        },
        {
          startDate: new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1,
          ).toLocaleDateString("en-CA"),
          endDate: "today",
          name: "thisMonth",
        },
      ],
    },
    notes: ["THINKS IT'S 2023..."],
  },
  {
    id: "channel-traffic-trend",
    title: "Channel Traffic - 30 Day Trend",
    description: "How has channel traffic changed in the last 30 days?",
    inputPrompt: "How has channel traffic changed in the last 30 days?",
    targetParameters: {
      metrics: [
        {
          name: "activeUsers",
        },
        {
          name: "sessions",
          optional: true,
        },
        {
          name: "engagedSessions",
          optional: true,
        },
      ],
      dimensions: [
        {
          name: "sessionDefaultChannelGroup",
        },
        {
          name: "date",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      orderBys: {
        metric: null,
        dimension: {
          dimensionName: "date",
          orderType: "ALPHANUMERIC",
        },
        desc: true,
      },
    },
    notes: ["✅ Checked with GA4 Reports"],
  },
  {
    id: "device-sessions-30-days",
    title: "Device Sessions - Last 30 Days",
    description: "Show last 30 days of session data and segment by device.",
    inputPrompt: "Show last 30 days of session data and segment by device.",
    targetParameters: {
      metrics: [
        {
          name: "sessions",
        },
        {
          name: "engagedSessions",
          optional: true,
        },
        {
          name: "averageSessionDuration",
          optional: true,
        },
      ],
      dimensions: [
        {
          name: "deviceCategory",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
    notes: ["✅ Looks right", "ORDERBY ERROR"],
  },
  {
    id: "mobile-vs-desktop-sessions",
    title: "Mobile vs Desktop Session Distribution",
    description:
      "In the last 30 days of session data what percentage of sessions are mobile vs desktop?",
    inputPrompt:
      "In the last 30 days of session data what percentage of sessions are mobile vs desktop?",
    targetParameters: {
      metrics: [
        {
          name: "sessions",
        },
        {
          name: "engagedSessions",
          optional: true,
        },
      ],
      dimensions: [
        {
          name: "deviceCategory",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "distinct-events-30-days",
    title: "Distinct Events - Last 30 Days",
    description: "How many distinct events triggered in the list 30 days?",
    inputPrompt: "How many distinct events triggered in the list 30 days?",
    targetParameters: {
      metrics: [
        {
          name: "eventCount",
        },
      ],
      dimensions: [
        {
          name: "eventName",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "event-frequency-30-days",
    title: "Event Frequency Analysis",
    description:
      "List all the event names and how many times they were triggered in the last 30 days.",
    inputPrompt:
      "List all the event names and how many times they were triggered in the last 30 days.",
    targetParameters: {
      metrics: [
        {
          name: "eventCount",
        },
      ],
      dimensions: [
        {
          name: "eventName",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "user-countries",
    title: "User Geographic Distribution - Countries",
    description: "What countries are our users coming from?",
    inputPrompt: "What countries are our users coming from?",
    targetParameters: {
      metrics: [
        {
          name: "activeUsers",
        },
      ],
      dimensions: [
        {
          name: "country",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
    notes: ["✅ Checked with GA4 Reports"],
  },
  {
    id: "user-country-region",
    title: "User Geographic Distribution - Country/Region",
    description: "Which region are our users coming from?",
    inputPrompt: "Which region are our users coming from?",
    targetParameters: {
      metrics: [
        {
          name: "activeUsers",
        },
      ],
      dimensions: [
        {
          name: "country",
          optional: true,
        },
        {
          name: "region",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "top-landing-pages",
    title: "Top 5 Landing Pages by Sessions",
    description: "What are the top 5 landing pages ordered by sessions?",
    inputPrompt: "What are the top 5 landing pages ordered by sessions?",
    targetParameters: {
      metrics: [
        {
          name: "sessions",
        },
      ],
      dimensions: [
        {
          name: "landingPage",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      orderBys: {
        metric: {
          metricName: "sessions",
        },
        dimension: null,
        desc: true,
      },
      limit: 5,
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "top-pages-by-views",
    title: "Top 5 Pages by Pageviews",
    description: "What are the top 5 pages by views?",
    inputPrompt: "What are the top 5 pages by views?",
    targetParameters: {
      metrics: [
        {
          name: "screenPageViews",
        },
      ],
      dimensions: [
        {
          name: "pagePath",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      orderBys: {
        metric: {
          metricName: "screenPageViews",
        },
        dimension: null,
        desc: true,
      },
      limit: 5,
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "engaged-sessions-percentage",
    title: "Engaged Sessions Rate - 30 Day Trend",
    description:
      "Calculate the percentage of engaged sessions out of total sessions day on day.",
    inputPrompt:
      "Calculate the percentage of engaged sessions out of total sessions day on day.",
    targetParameters: {
      metrics: [
        {
          name: "engagementRate",
        },
        {
          name: "engagedSessions",
          optional: true,
        },
        {
          name: "sessions",
          optional: true,
        },
      ],
      dimensions: [
        {
          name: "date",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      orderBys: {
        metric: null,
        dimension: {
          dimensionName: "date",
          orderType: "ALPHANUMERIC",
        },
        desc: true,
      },
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "bounce-rate-past-week",
    title: "Bounce Rate Past Week",
    description: "Bounce rate for the past seven days.",
    inputPrompt: "What's our bounce rate for the past week?",
    tags: ["Base Metrics", "Date and Time"],
    targetParameters: {
      metrics: [
        {
          name: "bounceRate",
        },
      ],
      dimensions: [
        {
          name: "date",
        },
      ],
      dateRanges: [
        {
          startDate: "7daysAgo",
          endDate: "today",
        },
      ],
      orderBys: {
        metric: null,
        dimension: {
          dimensionName: "date",
          orderType: "ALPHANUMERIC",
        },
        desc: true,
      },
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "new-users-this-quarter",
    title: "New Users This Quarter",
    description: "Number of new users acquired during the current quarter.",
    inputPrompt: "How many new users have we acquired this quarter?",
    tags: ["Base Metrics", "Date and Time"],
    targetParameters: {
      metrics: [
        {
          name: "newUsers",
        },
      ],
      dimensions: [
        {
          name: "yearMonth",
          optional: true,
        },
      ],
      dateRanges: [
        {
          startDate: "2024-10-01",
          endDate: "today",
        },
      ],
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "average-session-duration",
    title: "Average Session Duration",
    description: "The average duration of sessions on our site.",
    inputPrompt: "What is the average session duration for our site?",
    tags: ["Base Metrics"],
    targetParameters: {
      metrics: [
        {
          name: "averageSessionDuration",
        },
      ],
      dimensions: [
        {
          name: "date",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      orderBys: {
        metric: null,
        dimension: {
          dimensionName: "date",
          orderType: "ALPHANUMERIC",
        },
        desc: true,
      },
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "sessions-on-weekend",
    title: "Weekend Sessions",
    description: "Number of sessions that occurred during weekends.",
    inputPrompt: "How many sessions occurred on the weekend?",
    tags: ["Date and Time"],
    targetParameters: {
      metrics: [
        {
          name: "sessions",
        },
      ],
      dimensions: [
        {
          name: "dayOfWeekName",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "dayOfWeekName",
          inListFilter: {
            values: ["Saturday", "Sunday"],
            caseSensitive: false,
          },
        },
      },
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "hourly-active-users",
    title: "Hourly Active Users",
    description: "Hourly breakdown of active users.",
    inputPrompt: "What is the hourly breakdown of active users?",
    tags: ["Date and Time"],
    targetParameters: {
      metrics: [
        {
          name: "activeUsers",
        },
      ],
      dimensions: [
        {
          name: "hour",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      orderBys: {
        metric: {
          metricName: "activeUsers",
        },
        dimension: null,
        desc: true,
      },
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "highest-engagement-day",
    title: "Highest Engagement Day",
    description: "The day of the week with the highest engagement rate.",
    inputPrompt: "Which day of the week has the highest engagement rate?",
    tags: ["Date and Time", "User Behavior"],
    targetParameters: {
      metrics: [
        {
          name: "engagementRate",
        },
        {
          name: "engagedSessions",
          optional: true,
        },
        {
          name: "sessions",
          optional: true,
        },
      ],
      dimensions: [
        {
          name: "dayOfWeekName",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      orderBys: {
        metric: {
          metricName: "engagementRate",
        },
        dimension: null,
        desc: true,
      },
      limit: 7,
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "active-users-trend-last-7-days",
    title: "Active Users Trend Last 7 Days",
    description: "Trend of active users over the last seven days.",
    inputPrompt: "How did our active users trend over the last 7 days?",
    tags: ["Trend Analysis", "Date and Time"],
    targetParameters: {
      metrics: [
        {
          name: "activeUsers",
        },
      ],
      dimensions: [
        {
          name: "date",
        },
      ],
      dateRanges: [
        {
          startDate: "6daysAgo",
          endDate: "today",
        },
      ],
      orderBys: {
        metric: null,
        dimension: {
          dimensionName: "date",
          orderType: "ALPHANUMERIC",
        },
        desc: false,
      },
    },
    notes: ["✅ Looks right", "AGENT CHOOSES 7daysAgo instead of 6daysAgo"],
  },
  {
    id: "compare-active-users-month-over-month",
    title: "Active Users Month-over-Month Comparison",
    description:
      "Comparison of active users between this month and last month.",
    inputPrompt: "How does this month's active users compare to last month's?",
    tags: ["Comparisons", "Date and Time"],
    targetParameters: {
      metrics: [
        {
          name: "activeUsers",
        },
      ],
      dimensions: [],
      dateRanges: [
        {
          startDate: new Date(
            new Date().getFullYear(),
            new Date().getMonth() - 1,
            1,
          ).toLocaleDateString("en-CA"),
          endDate: new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            0,
          ).toLocaleDateString("en-CA"),
          name: "lastMonth",
        },
        {
          startDate: new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1,
          ).toLocaleDateString("en-CA"),
          endDate: "today",
          name: "thisMonth",
        },
      ],
    },
    notes: ["✅ Looks right", "AGENT CHOOSES today's date instead of 'today'"],
  },
  {
    id: "bounce-rate-week-over-week",
    title: "Bounce Rate Week-over-Week Comparison",
    description: "Week-over-week comparison of bounce rate.",
    inputPrompt: "Did our bounce rate improve compared to last week?",
    tags: ["Comparisons", "Date and Time"],
    targetParameters: {
      metrics: [
        {
          name: "bounceRate",
        },
      ],
      dimensions: [],
      dateRanges: [
        {
          startDate: "2024-11-18",
          endDate: "today",
          name: "This Week",
        },
        {
          startDate: "2024-11-11",
          endDate: "2024-11-17",
          name: "Last Week",
        },
      ],
      orderBys: {
        metric: {
          metricName: "bounceRate",
        },
        dimension: null,
        desc: true,
      },
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "avg-session-duration-quarterly",
    title: "Average Session Duration Quarterly Comparison",
    description: "Quarterly comparison of average session duration.",
    inputPrompt:
      "Has our average session duration increased compared to last quarter?",
    tags: ["Comparisons", "Date and Time"],
    targetParameters: {
      metrics: [
        {
          name: "averageSessionDuration",
        },
      ],
      dimensions: [],
      dateRanges: [
        {
          startDate: "2024-07-01",
          endDate: "2024-09-30",
          name: "previous_quarter",
        },
        {
          startDate: "2024-10-01",
          endDate: "today",
          name: "current_quarter",
        },
      ],
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "mobile-users-count",
    title: "Mobile Users Count",
    description: "Number of users visiting from mobile devices.",
    inputPrompt: "How many mobile users visited our site?",
    tags: ["Segmentation", "Device and Technology"],
    targetParameters: {
      metrics: [
        {
          name: "activeUsers",
        },
      ],
      dimensions: [
        {
          name: "deviceCategory",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "deviceCategory",
          stringFilter: {
            matchType: "EXACT",
            value: "mobile",
            caseSensitive: false,
          },
        },
      },
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "bounce-rate-us",
    title: "Bounce Rate in the US",
    description: "Bounce rate for users located in the United States.",
    inputPrompt: "What is the bounce rate for users from the United States?",
    tags: ["Segmentation", "Geographic"],
    targetParameters: {
      metrics: [
        {
          name: "bounceRate",
        },
      ],
      dimensions: [
        {
          name: "country",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "country",
          stringFilter: {
            matchType: "EXACT",
            value: "United States",
            caseSensitive: false,
          },
        },
      },
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "sessions-organic-search",
    title: "Sessions from Organic Search",
    description: "Number of sessions that came from organic search.",
    inputPrompt: "How many sessions came from organic search?",
    tags: ["Segmentation", "Channel Analysis"],
    targetParameters: {
      metrics: [
        {
          name: "sessions",
        },
      ],
      dimensions: [
        {
          name: "sessionDefaultChannelGroup",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "sessionDefaultChannelGroup",
          stringFilter: {
            matchType: "EXACT",
            value: "Organic Search",
            caseSensitive: false,
          },
        },
      },
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "top-traffic-source-new-users",
    title: "Top Traffic Source for New Users",
    description: "Traffic source that brought in the most new users.",
    inputPrompt: "Which traffic source brought in the most new users?",
    tags: ["Channel Analysis", "Segmentation"],
    targetParameters: {
      metrics: [
        {
          name: "newUsers",
        },
      ],
      dimensions: [
        {
          name: "sessionSource",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      orderBys: {
        metric: {
          metricName: "newUsers",
        },
        dimension: null,
        desc: true,
      },
      limit: 5,
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "engagement-rate-social-media",
    title: "Engagement Rate from Social Media",
    description: "Engagement rate for users coming from social media channels.",
    inputPrompt:
      "What is the engagement rate for users coming from social media?",
    tags: ["Channel Analysis", "User Behavior"],
    targetParameters: {
      metrics: [
        {
          name: "engagementRate",
        },
      ],
      dimensions: [
        {
          name: "sessionDefaultChannelGroup",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "sessionDefaultChannelGroup",
          stringFilter: {
            matchType: "EXACT",
            value: "Organic Social",
            caseSensitive: false,
          },
        },
      },
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "sessions-from-email",
    title: "Sessions from Email Campaigns",
    description: "Number of sessions originating from email campaigns.",
    inputPrompt: "How many sessions originated from email campaigns?",
    tags: ["Channel Analysis", "Segmentation"],
    targetParameters: {
      metrics: [
        {
          name: "sessions",
        },
      ],
      dimensions: [
        {
          name: "sessionDefaultChannelGroup",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "sessionDefaultChannelGroup",
          stringFilter: {
            matchType: "EXACT",
            value: "Email",
            caseSensitive: false,
          },
        },
      },
    },
    notes: [
      "Looks right but we don't have email campaigns set up in GA4 so we don't get any results",
    ],
  },
  {
    id: "percentage-mobile-users",
    title: "Percentage of Mobile Users",
    description: "Proportion of users using mobile devices.",
    inputPrompt: "What percentage of users are on mobile devices?",
    tags: ["Device and Technology", "Segmentation"],
    targetParameters: {
      metrics: [
        {
          name: "activeUsers",
        },
      ],
      dimensions: [
        {
          name: "deviceCategory",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "most-popular-browsers",
    title: "Most Popular Browsers",
    description: "Browsers most commonly used by our users.",
    inputPrompt: "Which browsers are most popular among our users?",
    tags: ["Device and Technology"],
    targetParameters: {
      metrics: [
        {
          name: "activeUsers",
        },
      ],
      dimensions: [
        {
          name: "browser",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      orderBys: {
        metric: {
          metricName: "activeUsers",
        },
        dimension: null,
        desc: true,
      },
      limit: 10,
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "sessions-from-android",
    title: "Sessions from Android Devices",
    description: "Number of sessions from Android devices.",
    inputPrompt: "How many sessions came from Android devices?",
    tags: ["Device and Technology", "Segmentation"],
    targetParameters: {
      metrics: [{ name: "sessions" }],
      dimensions: [{ name: "platform" }],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
  },
  {
    id: "users-from-new-york-city",
    title: "Users from New York City",
    description: "Number of users located in New York City.",
    inputPrompt: "How many users are from New York City?",
    tags: ["Geographic"],
    targetParameters: {
      metrics: [
        {
          name: "activeUsers",
        },
      ],
      dimensions: [
        {
          name: "city",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "city",
          stringFilter: {
            matchType: "EXACT",
            value: "New York",
            caseSensitive: false,
          },
        },
      },
    },
  },
  {
    id: "top-countries-active-users",
    title: "Top Countries by Active Users",
    description: "Countries with the highest number of active users.",
    inputPrompt: "Which countries have the highest number of active users?",
    tags: ["Geographic"],
    targetParameters: {
      metrics: [
        {
          name: "activeUsers",
        },
      ],
      dimensions: [
        {
          name: "country",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      orderBys: {
        metric: {
          metricName: "activeUsers",
        },
        dimension: null,
        desc: true,
      },
      limit: 10,
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "engagement-rate-europe",
    title: "Engagement Rate in Europe",
    description: "Engagement rate for users in Europe.",
    inputPrompt: "What is the engagement rate for users in Europe?",
    tags: ["Geographic", "User Behavior"],
    targetParameters: {
      metrics: [
        {
          name: "engagementRate",
        },
      ],
      dimensions: [
        {
          name: "continent",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "continent",
          stringFilter: {
            matchType: "EXACT",
            value: "Europe",
            caseSensitive: false,
          },
        },
      },
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "users-scrolled-90-percent",
    title: "Users Who Scrolled 90%",
    description: "Number of users who scrolled at least 90% down the page.",
    inputPrompt: "How many users scrolled down at least 90% of the page?",
    tags: ["User Behavior"],
    targetParameters: {
      metrics: [
        {
          name: "scrolledUsers",
        },
      ],
      dimensions: [
        {
          name: "date",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      orderBys: {
        metric: {
          metricName: "scrolledUsers",
        },
        dimension: null,
        desc: true,
      },
      limit: 100,
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "average-events-per-session",
    title: "Average Events per Session",
    description: "The average number of events per session.",
    inputPrompt: "What is the average number of events per session?",
    tags: ["User Behavior"],
    targetParameters: {
      metrics: [
        {
          name: "eventsPerSession",
        },
      ],
      dimensions: [
        {
          name: "date",
          optional: true,
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
  },
  {
    id: "engaged-sessions-count",
    title: "Engaged Sessions Count",
    description: "Total number of engaged sessions.",
    inputPrompt: "How many sessions were engaged sessions?",
    tags: ["User Behavior"],
    targetParameters: {
      metrics: [
        {
          name: "engagedSessions",
        },
        {
          name: "sessions",
        },
      ],
      dimensions: [
        {
          name: "date",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      orderBys: {
        metric: null,
        dimension: {
          dimensionName: "date",
          orderType: "ALPHANUMERIC",
        },
        desc: true,
      },
    },
    notes: [],
  },
  {
    id: "top-pages-by-views",
    title: "Top Pages by Views",
    description: "Pages with the highest number of views.",
    inputPrompt: "Which pages have the most views?",
    tags: ["Content Analysis"],
    targetParameters: {
      metrics: [
        {
          name: "screenPageViews",
        },
      ],
      dimensions: [
        {
          name: "pagePath",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      orderBys: {
        metric: {
          metricName: "screenPageViews",
        },
        dimension: null,
        desc: true,
      },
      limit: 5,
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "average-views-per-user",
    title: "Average Views per User",
    description: "Average number of page views per user.",
    inputPrompt: "What is the average views per user?",
    tags: ["Content Analysis", "User Behavior"],
    targetParameters: {
      metrics: [
        {
          name: "screenPageViewsPerUser",
        },
      ],
      dimensions: [
        {
          name: "date",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      orderBys: {
        metric: null,
        dimension: {
          dimensionName: "date",
          orderType: "ALPHANUMERIC",
        },
        desc: true,
      },
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "landing-pages-highest-bounce",
    title: "Landing Pages with Highest Bounce Rate",
    description: "Landing pages with the highest bounce rate.",
    inputPrompt: "Which landing pages have the highest bounce rate?",
    tags: ["Content Analysis", "User Behavior"],
    targetParameters: {
      metrics: [
        {
          name: "bounceRate",
        },
      ],
      dimensions: [
        {
          name: "landingPage",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      orderBys: {
        metric: {
          metricName: "bounceRate",
        },
        dimension: null,
        desc: true,
      },
      limit: 10,
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "peak-traffic-hours",
    title: "Peak Traffic Hours",
    description: "Hours of the day with the highest user activity.",
    inputPrompt: "What are the peak hours of traffic?",
    tags: ["Date and Time"],
    targetParameters: {
      metrics: [
        {
          name: "activeUsers",
        },
      ],
      dimensions: [
        {
          name: "hour",
        },
      ],
      dateRanges: [
        {
          startDate: "6daysAgo",
          endDate: "today",
        },
      ],
      orderBys: {
        metric: null,
        dimension: {
          dimensionName: "hour",
          orderType: "NUMERIC",
        },
        desc: true,
      },
      limit: 24,
    },
    notes: [],
  },
  {
    id: "sessions-new-vs-returning",
    title: "Sessions by New vs Returning Users",
    description: "Number of sessions by new and returning users.",
    inputPrompt: "How many sessions are from new users versus returning users?",
    tags: ["User Behavior", "Segmentation"],
    targetParameters: {
      metrics: [
        {
          name: "sessions",
        },
      ],
      dimensions: [
        {
          name: "newVsReturning",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
  },
  {
    id: "session-duration-by-device",
    title: "Session Duration by Device Category",
    description: "Average session duration segmented by device category.",
    inputPrompt:
      "What is the average session duration for mobile, desktop, and tablet users?",
    tags: ["Device and Technology", "Segmentation"],
    targetParameters: {
      metrics: [
        {
          name: "averageSessionDuration",
        },
      ],
      dimensions: [
        {
          name: "deviceCategory",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "engagement-by-channel",
    title: "Engagement Rate by Channel",
    description: "Engagement rate segmented by marketing channel.",
    inputPrompt: "What is the engagement rate for each marketing channel?",
    tags: ["Channel Analysis", "User Behavior"],
    targetParameters: {
      metrics: [
        {
          name: "engagementRate",
        },
      ],
      dimensions: [
        {
          name: "sessionDefaultChannelGroup",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "top-key-events",
    title: "Top Key Events",
    description: "Key events with the highest occurrence.",
    inputPrompt: "Which key events are triggered most frequently?",
    tags: ["User Behavior", "Content Analysis"],
    targetParameters: {
      metrics: [
        {
          name: "keyEvents",
        },
      ],
      dimensions: [
        {
          name: "eventName",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      orderBys: {
        metric: {
          metricName: "keyEvents",
        },
        dimension: null,
        desc: true,
      },
      limit: 10,
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "sessions-per-user",
    title: "Sessions per User",
    description: "Average number of sessions per user.",
    inputPrompt: "How many sessions does the average user have?",
    tags: ["User Behavior", "Base Metrics"],
    targetParameters: {
      metrics: [
        {
          name: "sessionsPerUser",
        },
      ],
      dimensions: [],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
    notes: ["✅ Looks right"],
  },
  {
    id: "sessions-per-user-male-australia",
    title: "Sessions per Male User in Australia",
    description: "Average number of sessions per male user in Australia.",
    inputPrompt:
      "How many sessions does the average male user from Australia have?",
    tags: ["User Behavior", "Geographic", "Demographics", "andGroup"],
    targetParameters: {
      metrics: [
        {
          name: "sessionsPerUser",
        },
      ],
      dimensions: [
        {
          name: "userGender",
        },
        {
          name: "country",
        },
      ],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: "userGender",
                stringFilter: {
                  matchType: "EXACT",
                  value: "male",
                  caseSensitive: false,
                },
              },
            },
            {
              filter: {
                fieldName: "country",
                stringFilter: {
                  matchType: "EXACT",
                  value: "Germany",
                  caseSensitive: false,
                },
              },
            },
          ],
        },
      },
    },
    notes: [],
  },
  {
    id: "events-trend-over-time",
    title: "Events Trend Over Time",
    description: "Trend of event counts over a specified period.",
    inputPrompt: "How did the number of events change over the last month?",
    tags: ["Trend Analysis", "User Behavior"],
    targetParameters: {
      metrics: [{ name: "eventCount" }],
      dimensions: [{ name: "date" }],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
  },
  {
    id: "traffic-source-contribution",
    title: "Traffic Source Contribution",
    description: "Contribution of different traffic sources to total sessions.",
    inputPrompt:
      "What percentage of our sessions comes from each traffic source?",
    tags: ["Channel Analysis", "Segmentation"],
    targetParameters: {
      metrics: [{ name: "sessions" }],
      dimensions: [{ name: "medium" }],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
  },
  {
    id: "top-languages",
    title: "Top User Languages",
    description: "Most common languages among users.",
    inputPrompt: "What are the top languages of our users?",
    tags: ["Segmentation", "User Behavior"],
    targetParameters: {
      metrics: [{ name: "activeUsers" }],
      dimensions: [{ name: "language" }],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
  },
  {
    id: "screen-resolution-stats",
    title: "Screen Resolution Statistics",
    description: "Distribution of users by screen resolution.",
    inputPrompt: "What are the most common screen resolutions among our users?",
    tags: ["Device and Technology"],
    targetParameters: {
      metrics: [{ name: "activeUsers" }],
      dimensions: [{ name: "screenResolution" }],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
  },
  {
    id: "video-engagement-metrics",
    title: "Video Engagement Metrics",
    description: "Metrics related to video engagement.",
    inputPrompt: "How are users interacting with our video content?",
    tags: ["Content Analysis", "User Behavior"],
    targetParameters: {
      metrics: [
        { name: "videoStart" },
        { name: "videoProgress" },
        { name: "videoComplete" },
      ],
      dimensions: [],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
  },
  {
    id: "page-referrer-analysis",
    title: "Page Referrer Analysis",
    description: "Analysis of the pages that referred users to our site.",
    inputPrompt: "What are the top referring pages to our site?",
    tags: ["Channel Analysis"],
    targetParameters: {
      metrics: [{ name: "sessions" }],
      dimensions: [{ name: "pageReferrer" }],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
  },
  {
    id: "operating-system-popularity",
    title: "Operating System Popularity",
    description: "Popularity of operating systems among users.",
    inputPrompt: "Which operating systems are most popular among our users?",
    tags: ["Device and Technology"],
    targetParameters: {
      metrics: [{ name: "activeUsers" }],
      dimensions: [{ name: "operatingSystem" }],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
  },
  {
    id: "new-users-by-source",
    title: "New Users by Source",
    description: "Number of new users segmented by traffic source.",
    inputPrompt: "How many new users did we get from each traffic source?",
    tags: ["Channel Analysis", "Segmentation"],
    targetParameters: {
      metrics: [{ name: "newUsers" }],
      dimensions: [{ name: "medium" }],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
  },
  {
    id: "top-landing-pages",
    title: "Top Landing Pages",
    description: "Landing pages with the highest number of entrances.",
    inputPrompt: "Which are our top landing pages?",
    tags: ["Content Analysis"],
    targetParameters: {
      metrics: [{ name: "entrances" }],
      dimensions: [{ name: "landingPage" }],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
  },
  {
    id: "session-key-event-rate",
    title: "Session Key Event Rate",
    description: "Percentage of sessions in which any key event was triggered.",
    inputPrompt: "What is the session key event rate?",
    tags: ["User Behavior"],
    targetParameters: {
      metrics: [{ name: "eventPerSession" }],
      dimensions: [],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
  },
  {
    id: "user-key-event-rate",
    title: "User Key Event Rate",
    description: "Percentage of users who triggered any key event.",
    inputPrompt: "What is the user key event rate?",
    tags: ["User Behavior"],
    targetParameters: {
      metrics: [{ name: "eventPerUser" }],
      dimensions: [],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
  },
  {
    id: "sessions-by-device-model",
    title: "Sessions by Device Model",
    description: "Number of sessions segmented by device model.",
    inputPrompt: "How many sessions are coming from different device models?",
    tags: ["Device and Technology"],
    targetParameters: {
      metrics: [{ name: "sessions" }],
      dimensions: [{ name: "deviceModel" }],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
  },
  {
    id: "sessions-by-browser",
    title: "Sessions by Browser",
    description: "Number of sessions segmented by browser.",
    inputPrompt: "How many sessions did we get from each browser?",
    tags: ["Device and Technology"],
    targetParameters: {
      metrics: [{ name: "sessions" }],
      dimensions: [{ name: "browser" }],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
  },
  {
    id: "sessions-by-continent",
    title: "Sessions by Continent",
    description: "Number of sessions segmented by continent.",
    inputPrompt: "How many sessions did we get from each continent?",
    tags: ["Geographic"],
    targetParameters: {
      metrics: [{ name: "sessions" }],
      dimensions: [{ name: "continent" }],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
  },
  {
    id: "wau-per-mau",
    title: "WAU / MAU Ratio",
    description:
      "Rolling percent of 30-day active users who are also 7-day active users.",
    inputPrompt: "What is our WAU / MAU ratio?",
    tags: ["User Behavior", "Trend Analysis"],
    targetParameters: {
      metrics: [
        { name: "activeUsers" },
        { name: "weeklyActiveUsers" },
        { name: "monthlyActiveUsers" },
      ],
      dimensions: [],
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
    },
  },
] as const;
