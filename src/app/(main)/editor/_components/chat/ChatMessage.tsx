"use client";

import React, { type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { ApplyCodeBlock } from "./ApplyCodeBlock";
import { type ChatMessageType } from "./chatStore";
import { StaticEditor } from "./StaticEditor";

export const ChatMessage = ({ message }: { message: ChatMessageType }) => {
  if (message.type === "assistant") {
    return (
      <div className="p-2 text-sm">
        <ReactMarkdown
          components={{
            pre: ({ children, ...props }) => (
              <CodeBlock {...props} knowledgeSources={message.knowledgeSources}>
                {children}
              </CodeBlock>
            ),
            code: CodeInline,
            ul: ({ children }) => (
              <ul className="list-disc space-y-1 pl-6">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal space-y-1 pl-6">{children}</ol>
            ),
            li: ({ children }) => <li className="text-gray-800">{children}</li>,
          }}
          className="space-y-2"
        >
          {message.content}
        </ReactMarkdown>
        {/* {message.knowledgeSources.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-medium text-gray-600">Sources</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {message.knowledgeSources.flatMap(({ knowledgeSourceIds }) =>
                knowledgeSourceIds.map((knowledgeId) => (
                  <KnowledgeSourceComponent
                    key={knowledgeId}
                    knowledgeId={knowledgeId}
                  />
                )),
              )}
            </div>
          </div>
        )} */}
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white px-3 py-2 text-sm text-gray-800 shadow">
      {message.editorSelectionContent && (
        <div className="mb-2 border pr-3">
          <StaticEditor value={message.editorSelectionContent} />
        </div>
      )}
      {message.content}
    </div>
  );
};

const CodeInline = ({ children }: { children?: ReactNode }) => {
  return (
    <code className="rounded bg-gray-300 px-1 py-0.5 text-sm text-gray-800">
      {children}
    </code>
  );
};

const CodeBlock = ({
  children,
  knowledgeSources,
}: {
  children?: ReactNode;
  knowledgeSources: {
    key: number;
    knowledgeSourceIds: string[];
  }[];
}) => {
  if (!React.isValidElement(children)) {
    throw new Error("Node passed to code block that isn't a valid element.");
  }

  if (children.props?.node?.tagName !== "code") {
    throw new Error("Node passed to code block that isn't a code element.");
  }

  const className = children.props.className;
  const language: string | null =
    typeof className === "string"
      ? (className
          .split(" ")
          .find((cls) => cls.startsWith("language-"))
          ?.replace("language-", "") ?? null)
      : null;

  /*
    ReactMarkdown is stupid and passes both inline and block code elements
    through the CodeInline component first. Actually it might just be a generic
    <code> element, not sure if CodeInline. Anyway, we strip out the inline code
    wrapper here first and rewrap with our code block wrapper.
    This should just be a string now.

    Note that the <code> element has a className which is the langauge.
    e.g. language-sql
  */
  const codeContent = children.props.children;
  if (typeof codeContent !== "string") {
    throw new Error("Code content is not a string.");
  }

  let codeContentString = codeContent;
  codeContentString = codeContentString.replace(/\n+$/, "");

  return (
    <ApplyCodeBlock
      codeContent={codeContentString}
      language={language}
      knowledgeSources={knowledgeSources}
    />
  );
};
