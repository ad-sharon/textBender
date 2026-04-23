"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import send from "../../../public/send.svg";
import { toast } from "react-hot-toast";

export default function InputBox({
  messages,
  setMessages,
  setDetectedLanguage,
  setTranslatedText,
}) {
  const [inputText, setInputText] = useState("");
  const [detector, setDetector] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const initializeDetector = useCallback(async () => {
    const availability = await LanguageDetector.availability();

    if (availability === "unavailable") {
      toast.error("Language detection not available on this device.");
      return;
    }

    const newDetector = await LanguageDetector.create({
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => {
          const percent = Math.round((e.loaded / e.total) * 100);
          toast.loading(`Downloading model... ${percent}%`, { id: "download" });
        });
      },
    });

    await newDetector.ready;

    toast.dismiss("download");

    if (availability === "downloadable") {
      toast.success("Download done!");
    }

    setDetector(newDetector);
  }, []);

  //check if chrome ai is available/supported on client
  useEffect(() => {
    const checkSupport = async () => {
      let isSupported = [];

      if ("LanguageDetector" in self) {
        isSupported.push("Language Detection");
        await initializeDetector();
      }
      if ("Translator" in self) {
        isSupported.push("Translation");
      }
      if ("Summarizer" in self) {
        isSupported.push("Summarization");
      }
      if (isSupported.length > 0) {
        toast.success(
          `Your browser supports the following features: ${isSupported.join(
            ", ",
          )}!`,
          {
            duration: 2000,
          },
        );
      } else {
        toast.error(
          "Browser does not support Chrome AI APIs. Try updating your Chrome to the Chrome version 138+.",
          { duration: 3000 },
        );
      }
    };
    checkSupport();
  }, [initializeDetector]);

  //handle user input text changes
  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  // built-in JS function to change language code to full language name
  const getFullLanguageName = (languageCode) => {
    try {
      return (
        new Intl.DisplayNames(["en"], { type: "language" }).of(languageCode) ||
        languageCode
      );
    } catch (error) {
      return languageCode;
    }
  };

  //handle language detection of user input
  const detectLanguage = async () => {
    //runs if there's no input
    if (!inputText.trim()) {
      toast.error("No text inputted. Please enter some text.", {
        duration: 2000,
      });
      return;
    }

    try {
      setIsDetecting(true);

      if (detector) {
        // will run if browser AI detection is supported
        const result = await detector.detect(inputText);
        const detectedLanguage = result[0].detectedLanguage;
        const detectedLanguageFull = getFullLanguageName(detectedLanguage);
        setDetectedLanguage(detectedLanguage);
        setTranslatedText("");

        const newInput = {
          text: inputText,
          language: `Language Detected: ${detectedLanguageFull}`,
          confidence: `(${parseInt(result[0].confidence * 100)}% sure)`,
        };
        const updatedMessages = [...messages, newInput];
        setMessages(updatedMessages);
        localStorage.setItem("messages", JSON.stringify(updatedMessages));
      } else {
        // will run if browser AI or detector is unavailable"
        setTranslatedText("");
        const newMessage = {
          text: inputText,
          language: "AI not supported. Could not detect language.",
          confidence: null,
        };

        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);
        localStorage.setItem("messages", JSON.stringify(updatedMessages));
      }
    } catch (error) {
      toast.error("Error detecting language.");
    } finally {
      setInputText("");
      setIsDetecting(false);
    }
  };

  //handles form submission
  const onSubmit = (e) => {
    e.preventDefault();
    detectLanguage();
  };

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-[95%] mx-auto shrink-0 flex mt-2 items-center gap-2"
    >
      <textarea
        value={inputText}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            detectLanguage();
          }
        }}
        onChange={handleInputChange}
        className="w-full  resize-none border-2 border-[var(--color-text-grey)] rounded-xl bg-transparent text-sm p-2 "
        placeholder="Your text goes here..."
        rows={3}
        aria-label="input text here"
      ></textarea>
      <button
        type="submit"
        aria-label="send button"
        disabled={isDetecting}
        className="w-fit h-fit border bg-[var(--color-main)] hover:bg-[var(--color-lighter-main)] rounded-[50%] p-2"
      >
        <Image
          src={send}
          alt="send icon"
          aria-label="send icon"
          priority
          className="w-7 h-7"
        ></Image>
      </button>
    </form>
  );
}
