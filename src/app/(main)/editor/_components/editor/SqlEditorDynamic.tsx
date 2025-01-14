import dynamic from "next/dynamic";

/*
  If this is not dynamic and we just import directly from SqlEditor,
  hot reload seems to cause the entire page to reload.

  Also, this seems to need to be its own file otherwise hot reload
  doesn't reload the SqlEditor component properly.
  I think because if you modify the same file that contains a dynamic import definition,
  hot reload doesn't reload that component properly. So we put it here in its own file that
  shouldn't be modified often.
*/
export const SqlEditorDynamic = dynamic(
  () => import("./SqlEditor").then((mod) => mod.SqlEditor),
  {
    ssr: false,
    loading: () => <div>Loading editor...</div>,
  },
);
