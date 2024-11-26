"use client";

import { TableDataView } from "@/components/charting/TableDataView";
import { Button } from "@/components/ui/button";
import { type EvalApiTest } from "@/server/api/routers/eval/evalTestListAndFilter";
import { type GoogleAnalyticsReportParameters } from "@/server/googleAnalytics/reportParametersSchema";
import { api, type RouterOutputs } from "@/trpc/react";
import { useState } from "react";
import { MetadataDetails } from "./MetadataDetails";

export default function Page() {
  const workspaceUid = "FAKE_WORKSPACE_UID";
  const runEvalMutation = api.eval.runEvalTest.useMutation();

  const {
    data: evals,
    isLoading,
    error,
  } = api.eval.listEvalTests.useQuery(
    {
      workspaceUid,
    },
    {
      enabled: !!workspaceUid,
    },
  );

  const [testResults, setTestResults] = useState<
    Record<
      string,
      {
        success: boolean;
        error?: string;
        reason?: string;
        agentResponse?: GoogleAnalyticsReportParameters;
      }
    >
  >({});

  const [evalTestLoading, setEvalTestLoading] = useState<
    Record<string, boolean>
  >({});

  const [minIndex, setMinIndex] = useState<number>(0);

  const handleRunTest = async (evalId: string) => {
    // setTestResults((prev) => ({
    //   ...prev,
    //   [evalId]: {
    //     success: false,
    //     error: undefined,
    //     reason: undefined,
    //     agentResponse: undefined,
    //   },
    // }));
    if (!workspaceUid) return;

    setEvalTestLoading((prev) => ({
      ...prev,
      [evalId]: true,
    }));

    try {
      const response = await runEvalMutation.mutateAsync({
        workspaceUid,
        evalId,
      });
      setTestResults((prev) => ({
        ...prev,
        [evalId]: response,
      }));
    } catch (error) {
      console.error("Error running eval test:", error);
      setTestResults((prev) => ({
        ...prev,
        [evalId]: {
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
      }));
    } finally {
      setEvalTestLoading((prev) => ({
        ...prev,
        [evalId]: false,
      }));
    }
  };

  if (!workspaceUid) {
    return <div>Loading workspace...</div>;
  }

  const totalTests = evals?.length ?? 0;
  const testsRun = Object.keys(testResults).length;
  const passedTests = Object.values(testResults).filter(
    (r) => r.success,
  ).length;
  const failedTests = testsRun - passedTests;

  const handleRunAll = async () => {
    if (!evals) return;

    // Filter evals to only include those above minIndex
    const filteredEvals = evals.filter((_, index) => index >= minIndex);

    for (const evalTest of filteredEvals) {
      await handleRunTest(evalTest.id);
    }
  };

  const isAnyTestRunning = Object.values(evalTestLoading).some(Boolean);

  return (
    <div className="mx-auto flex w-full max-w-screen-lg flex-col">
      {error && <div className="text-red-500">Error: {error.message}</div>}

      <div className="mb-8 flex flex-col gap-y-2">
        <p className="text-gray-600">Workspace Uid: {workspaceUid}</p>
        <div className="mt-4 flex items-center gap-4">
          <p className="text-lg font-medium">
            Passed {passedTests}/{totalTests} ({failedTests} fails)
          </p>
          <Button
            onClick={handleRunAll}
            disabled={isLoading || isAnyTestRunning}
          >
            {isAnyTestRunning ? "Running..." : "Run All Tests"}
          </Button>
        </div>
        <div className="flex flex-col items-start">
          <div className="font-semi text-sm text-gray-700">Min Eval #</div>
          <input
            type="number"
            min="0"
            value={minIndex || ""}
            onChange={(e) =>
              setMinIndex(Math.max(0, parseInt(e.target.value) || 0))
            }
            className="w-20 rounded border px-2 py-1"
            placeholder="Min #"
            name="minIndex"
          />
        </div>
      </div>

      <MetadataDetails workspaceUid={workspaceUid} />

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-gray-500">Loading evaluation tests...</p>
        </div>
      ) : evals && evals.length > 0 ? (
        <div className="flex flex-col gap-4">
          {evals
            .filter((_, index) => index >= minIndex)
            .map((evalTest, index) => (
              <EvalTestComponent
                key={evalTest.title}
                evalTest={evalTest}
                onRun={() => handleRunTest(evalTest.id)}
                isRunning={evalTestLoading[evalTest.id] ?? false}
                result={testResults[evalTest.id]}
                workspaceUid={workspaceUid}
                index={index + minIndex}
              />
            ))}
        </div>
      ) : (
        <div className="flex items-center justify-center p-8">
          <p className="text-gray-500">No evaluation tests available</p>
        </div>
      )}
    </div>
  );
}

const EvalTestComponent = ({
  evalTest,
  onRun,
  isRunning,
  result,
  workspaceUid,
  index,
}: {
  evalTest: EvalApiTest;
  onRun: () => Promise<void>;
  isRunning: boolean;
  workspaceUid: string;
  index: number;
  result:
    | {
        success: boolean;
        error?: string;
        reason?: string;
        agentResponse?: GoogleAnalyticsReportParameters;
      }
    | undefined;
}) => {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex flex-row items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold">
            {index + 1}. <b>{evalTest.title}</b> ({evalTest.id})
          </h3>
          <p className="text-md text-gray-600">
            Description: {evalTest.description || "No description provided"}
          </p>
          {evalTest?.notes && (
            <div className="mt-2 rounded bg-gray-100 p-2">
              {evalTest?.notes.map((note, index) => (
                <p key={index} className="text-md text-gray-600">
                  {note}
                </p>
              ))}
            </div>
          )}
        </div>
        <Button onClick={onRun} disabled={isRunning}>
          {isRunning ? "Running..." : "Run"}
        </Button>
      </div>
      <details className="mt-4" open>
        <summary className="mb-2 cursor-pointer font-medium">
          Input Prompt
        </summary>
        <pre className="bg-gray-100 p-2 text-sm">{evalTest.inputPrompt}</pre>
      </details>
      <details className="mt-4">
        <summary className="mb-2 cursor-pointer font-medium">
          Target Parameters
        </summary>
        <div className="space-y-4">
          <pre className="bg-gray-100 p-2 text-sm">
            {JSON.stringify(evalTest.targetParameters, null, 2)}
          </pre>
          <GoogleAnalyticsReportRunner
            workspaceUid={workspaceUid}
            parameters={evalTest.targetParameters}
          />
        </div>
      </details>
      {result && (
        <details className="mt-4" open>
          <summary className="mb-2 cursor-pointer font-medium">
            <div className="inline-block">
              <div className="flex items-center gap-2">
                <h4 className="font-bold">Result:</h4>
                {result.success ? (
                  <span className="font-medium text-[#00AA00]">Success</span>
                ) : (
                  <span className="font-medium text-[#AA0000]">Failed</span>
                )}
              </div>
            </div>
          </summary>

          {!result.success && result.error && (
            <div className="mb-4 rounded-md border border-[#FECACA] bg-[#FEF2F2] p-3">
              <p className="text-red-700">Error message: {result.error}</p>
            </div>
          )}

          {result.success && result.reason && (
            <div className="mb-4 rounded-md border border-[#BBF7D0] bg-[#F0FDF4] p-3">
              <p className="text-green-700">Success reason: {result.reason}</p>
            </div>
          )}

          {result.agentResponse && (
            <div>
              <h4 className="mb-2 font-medium">Agent Response:</h4>
              <pre className="bg-gray-100 p-2 text-sm">
                {JSON.stringify(result.agentResponse, null, 2)}
              </pre>
              <div className="mt-4">
                <GoogleAnalyticsReportRunner
                  workspaceUid={workspaceUid}
                  parameters={result.agentResponse}
                />
              </div>
            </div>
          )}
        </details>
      )}
    </div>
  );
};

type GoogleAnalyticsReportResultType =
  RouterOutputs["eval"]["executeGoogleAnalyticsReport"];

const GoogleAnalyticsReportRunner = ({
  workspaceUid,
  parameters,
}: {
  workspaceUid: string;
  parameters: GoogleAnalyticsReportParameters;
}) => {
  const executeReportMutation =
    api.eval.executeGoogleAnalyticsReport.useMutation();
  const [reportResult, setReportResult] = useState<
    GoogleAnalyticsReportResultType["data"] | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunReport = async () => {
    try {
      const response = await executeReportMutation.mutateAsync({
        workspaceUid,
        parameters,
      });
      if (response.success) {
        setReportResult(
          response.data as GoogleAnalyticsReportResultType["data"],
        );
        setError(null);
      } else {
        setReportResult(null);
        setError(response.error);
      }
    } catch (err) {
      console.error("Error running GA4 report:", err);
      setReportResult(null);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    }
  };

  return (
    <div className="">
      <div className="flex justify-start">
        <Button
          variant="secondary"
          onClick={handleRunReport}
          disabled={executeReportMutation.isPending}
        >
          {executeReportMutation.isPending ? "Running Report..." : "Run Report"}
        </Button>
      </div>
      {(reportResult ?? error) && (
        <details className="ml-8 mt-4" open>
          <summary className="mb-2 cursor-pointer font-medium">
            Report Result
          </summary>
          {error && <div className="mb-4 text-red-500">Error: {error}</div>}
          {reportResult && (
            <div className="my-4 bg-gray-50">
              <TableDataView className="h-[300px]" data={reportResult.rows} />
            </div>
          )}
          <details className="ml-8 mt-4">
            <summary className="mb-2 cursor-pointer font-medium">
              Full Report
            </summary>
            <pre className="text-wrap bg-gray-100 p-2 text-sm">
              {JSON.stringify(reportResult ?? { error }, null, 2)}
            </pre>
          </details>
        </details>
      )}
    </div>
  );
};
