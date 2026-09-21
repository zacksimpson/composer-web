import {
  Editor,
  defaultValueCtx,
  editorViewCtx,
  parserCtx,
  prosePluginsCtx,
  rootCtx,
  serializerCtx,
} from "@milkdown/core";
import { clipboard } from "@milkdown/plugin-clipboard";
import { history } from "@milkdown/plugin-history";
import { commonmark } from "@milkdown/preset-commonmark";
import { Plugin, Selection } from "@milkdown/prose/state";
import { useEffect, useRef } from "react";
import "./editor.css";

const SAVE_DEBOUNCE_MS = 600;

function serialize(editor: Editor): string {
  return editor.action((ctx) => ctx.get(serializerCtx)(ctx.get(editorViewCtx).state.doc));
}

function focusEnd(editor: Editor) {
  editor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    view.focus();
    view.dispatch(view.state.tr.setSelection(Selection.atEnd(view.state.doc)).scrollIntoView());
  });
}

function replaceContent(editor: Editor, markdown: string) {
  editor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    const doc = ctx.get(parserCtx)(markdown);
    if (!doc) return;
    view.dispatch(view.state.tr.replaceWith(0, view.state.doc.content.size, doc.content));
  });
}

/** uncontrolled markdown editor, key it per note */
export function NoteEditor({
  body,
  autoFocus,
  onSave,
}: {
  body: string;
  autoFocus: boolean;
  onSave: (markdown: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dirtyRef = useRef(false);
  // last value written to the store
  const savedRef = useRef(body);
  // last markdown the editor and store agree on
  const syncedRef = useRef(body);
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  });
  const initialRef = useRef({ body, autoFocus });

  useEffect(() => {
    const { body: initialBody, autoFocus: shouldFocus } = initialRef.current;
    const host = document.createElement("div");
    hostRef.current?.appendChild(host);
    let cancelled = false;

    function flush() {
      clearTimeout(timerRef.current);
      const editor = editorRef.current;
      if (!dirtyRef.current || !editor) return;
      dirtyRef.current = false;
      const markdown = serialize(editor);
      if (markdown === syncedRef.current) return;
      savedRef.current = markdown;
      syncedRef.current = markdown;
      onSaveRef.current(markdown);
    }

    const changePlugin = new Plugin({
      view: () => ({
        update(view, prevState) {
          if (view.state.doc.eq(prevState.doc)) return;
          dirtyRef.current = true;
          clearTimeout(timerRef.current);
          timerRef.current = setTimeout(flush, SAVE_DEBOUNCE_MS);
        },
      }),
    });

    Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, host);
        ctx.set(defaultValueCtx, initialBody);
        ctx.update(prosePluginsCtx, (plugins) => [...plugins, changePlugin]);
      })
      .use(commonmark)
      .use(history)
      .use(clipboard)
      .create()
      .then((editor) => {
        if (cancelled) {
          editor.destroy();
          return;
        }
        editorRef.current = editor;
        syncedRef.current = serialize(editor);
        editor.action((ctx) => ctx.get(editorViewCtx).dom.setAttribute("spellcheck", "true"));
        if (shouldFocus) focusEnd(editor);
      });

    window.addEventListener("pagehide", flush);
    return () => {
      cancelled = true;
      window.removeEventListener("pagehide", flush);
      flush();
      editorRef.current?.destroy();
      editorRef.current = null;
      host.remove();
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || dirtyRef.current || body === savedRef.current) return;
    savedRef.current = body;
    replaceContent(editor, body);
    syncedRef.current = serialize(editor);
  }, [body]);

  return <div ref={hostRef} className="composer-editor" />;
}
