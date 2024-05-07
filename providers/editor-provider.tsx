"use client";

import { EditorActions, CustomNodeType } from "@/lib/types";
import { Dispatch, createContext, useContext, useReducer } from "react";

export type Editor = {
  nodes: CustomNodeType[];
  edges: {
    id: string;
    source: string;
    target: string;
  }[];
  selectedNode: CustomNodeType;
};

export type HistoryState = {
  history: Editor[];
  currentIndex: number;
};

export type EditorState = {
  editor: Editor;
  history: HistoryState;
};

const initialEditorState: Editor = {
  nodes: [],
  edges: [],
  selectedNode: {
    data: {
      completed: false,
      current: false,
      description: "",
      metadata: {},
      title: "",
      type: "None",
    },
    id: "",
    position: { x: 0, y: 0 },
    type: "None",
  },
};

const initialHistoryState: HistoryState = {
  history: [initialEditorState],
  currentIndex: 0,
};

const initialState: EditorState = {
  editor: initialEditorState,
  history: initialHistoryState,
};

const editorReducer = (
  state: EditorState = initialState,
  action: EditorActions
): EditorState => {
  switch (action.type) {
    case "REDO":
      if (state.history.currentIndex < state.history.history.length - 1) {
        const nextIndex = state.history.currentIndex + 1;
        const nextEditorState = { ...state.history.history[nextIndex] };
        const redoState = {
          editor: nextEditorState,
          history: {
            ...state.history,
            currentIndex: nextIndex,
          },
        };
        return redoState;
      }
      return state;

    case "UNDO":
      if (state.history.currentIndex > 0) {
        const prevIndex = state.history.currentIndex - 1;
        const prevEditorState = { ...state.history.history[prevIndex] };
        const undoState = {
          editor: prevEditorState,
          history: {
            ...state.history,
            currentIndex: prevIndex,
          },
        };
        return undoState;
      }
      return state;

    case "LOAD_DATA":
      return {
        ...state,
        editor: {
          ...state.editor,
          nodes: action.payload.nodes.length
            ? action.payload.nodes
            : initialEditorState.nodes,
          edges: action.payload.edges.length
            ? action.payload.edges
            : initialEditorState.edges,
        },
      };
    case "SELECTED_ELEMENT":
      return {
        ...state,
        editor: {
          ...state.editor,
          selectedNode: action.payload.node,
        },
      };
    default:
      return state;
  }
};

export type EditorContextData = {
  previewMode: boolean;
  setPreviewMode: (previewMode: boolean) => void;
};

export const EditorContext = createContext<{
  state: EditorState;
  dispatch: Dispatch<EditorActions>;
}>({
  state: initialState,
  dispatch: () => undefined,
});

type EditorProps = {
  children: React.ReactNode;
};

const EditorProvider = ({ children }: EditorProps) => {
  const [state, dispatch] = useReducer(editorReducer, initialState);

  return (
    <EditorContext.Provider
      value={{
        state,
        dispatch,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor Hook must be used within the editor Provider");
  }
  return context;
};

export default EditorProvider;
