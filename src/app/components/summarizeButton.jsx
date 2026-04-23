"use client";
import { useState, useRef } from "react";
import { toast } from "react-hot-toast";

export default function Summarize({ inputText, detectedLanguage }) {
  const [summaryText, setSummaryText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const summarizerRef = useRef(null);

  //to handle summarize
  const handleSummarize = async () => {
    if (!inputText.trim()) {
      toast.error("No text to summarize.");
      return;
    }

    if (!("Summarizer" in self)) {
      toast.error("Summarizer not supported in this browser.");
      return;
    }

    try {
      setIsLoading(true);

      if (!summarizerRef.current) {
        const availability = await Summarizer.availability();

        if (availability === "unavailable") {
          toast.error(
            "Sorry. You don't have the device requirements needed to summarize text!",
          );
          return;
        }

        summarizerRef.current = await Summarizer.create({
          sharedContext: "Provide a concise summary with key points.",
          type: "key-points",
          format: "markdown",
          length: "medium",
          monitor(m) {
            m.addEventListener("downloadprogress", (e) => {
              const percent = Math.round((e.loaded / e.total) * 100);
              toast.loading(`Downloading summarizer... ${percent}%`, {
                id: "download",
              });
            });
          },
        });

        await summarizerRef.current.ready;
        toast.dismiss("download");

        if (availability === "downloadable") {
          toast.success("Download done!");
        }
      }

      const result = await summarizerRef.current.summarize(inputText, {
        context: "Keep it short.",
      });
      setSummaryText(result);
    } catch (error) {
      toast.error("Failed to summarize. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleSummarize}
        disabled={isLoading}
        className="text-[0.7rem] w-full max-w-fit text-center border button-bg p-1 rounded-lg hover:border-[var(--color-main)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Summarize
        <p className="text-[0.6rem] font-bold text-[var(--dark)]">
          {`Current Character Count: ${inputText.trim().length}`}
        </p>
      </button>

      {isLoading && (
        <p className="text-[0.6rem] text-[var(--color-text-grey)]">
          Summarizing...
        </p>
      )}

      {summaryText && (
        <section className="w-full min-w-full">
          <p className="text-[10px] font-bold">Summary</p>
          <section className="text-[0.8rem] border-2 border-[var(--color-purple)] p-2 flex flex-col gap-1 rounded-lg">
            <button
              onClick={() => setSummaryText("")}
              className="text-[0.55rem] font-bold ms-auto hover:underline hover:text-[var(--light)] text-[var(--color-text-grey)]"
            >
              Close
            </button>
            {summaryText !== "" ? (
              summaryText
            ) : (
              <p className="text-red-500 text-[0.5rem]">
                Sorry, your summary is not available.
              </p>
            )}
            <p className="text-[9px] ms-auto font-bold text-center text-[var(--light)]">
              Summary Character Count = {`${summaryText.trim().length}`}
            </p>
          </section>
        </section>
      )}
    </>
  );
}
