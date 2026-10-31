import { useEffect } from "react";
import { Editor } from "@/components/studio/Editor";
import { Home } from "@/components/studio/Home";
import { useStudio } from "@/lib/studio/store";

export function StudioApp() {
  const screen = useStudio((s) => s.screen);
  const boot = useStudio((s) => s.boot);
  const notice = useStudio((s) => s.notice);
  useEffect(() => {
    boot();
  }, [boot]);

  return (
    <div dir="rtl" className="h-dvh overflow-hidden bg-ink font-sans text-cream">
      {screen === "editor" ? <Editor /> : <Home />}
      {notice ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
          <p className="rounded-md bg-panel px-4 py-2 text-sm text-cream">{notice}</p>
        </div>
      ) : null}
    </div>
  );
}
