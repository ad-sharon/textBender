"use client";
import { useRef, useState } from "react";
import { toast } from "react-hot-toast";

const targetLanguages = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "pt", name: "Portuguese" },
  { code: "tr", name: "Turkish" },
  { code: "ru", name: "Russian" },
];

export default function Translate({
  inputText,
  detectedLanguage,
  translatedText,
  setTranslatedText,
}) {
  const [language, setLanguage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [translatedLanguage, setTranslatedLanguage] = useState("");

  const translatorRef = useRef(null);
  const translatorPairRef = useRef("");

  // function to handle change of translation language
  const handleLanguageSelection = (e) => {
    setLanguage(e.target.value);
  };

  //function to translate inputText
  const handleTranslation = async () => {
    //runs if theres no input
    if (!inputText.trim()) {
      toast.error("No text to translate. Please input some text!", {
        duration: 3000,
      });
      return;
    }

    //runs if language detection fails
    if (!detectedLanguage) {
      toast.error("No source language detected.");
      return;
    }

    //runs if no language is picked
    if (!language) {
      toast.error("No target language detected. Please pick a language.");
      return;
    }

    //runs if source and target are equal
    if (detectedLanguage === language) {
      toast.error(
        "Source and target language cannot be the same. Please pick another language.",
      );
      return;
    }

    try {
      setIsLoading(true);
      handleClose();

      const pair = `${detectedLanguage}->${language}`;

      // reuse cached translator if same pair
      if (!translatorRef.current || translatorPairRef.current !== pair) {
        const availability = await Translator.availability({
          sourceLanguage: detectedLanguage,
          targetLanguage: language,
        });

        if (availability === "unavailable") {
          toast.error("Sorry. This language pair is not supported.");
          return;
        }

        translatorRef.current = await Translator.create({
          sourceLanguage: detectedLanguage,
          targetLanguage: language,
          monitor(m) {
            m.addEventListener("downloadprogress", (e) => {
              const percent = Math.round((e.loaded / e.total) * 100);
              toast.loading(`Downloading language pair... ${percent}%`, {
                id: "download",
              });
            });
          },
        });

        await translatorRef.current.ready;

        toast.dismiss("download");

        if (availability === "downloadable") {
          toast.success("Download done!");
        }

        translatorPairRef.current = pair;
      }

      const result = await translatorRef.current.translate(inputText);
      setTranslatedLanguage(language);
      setTranslatedText(result);
    } catch (error) {
      console.error(error);
      toast.error("Failed to translate. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTranslatedText("");
  };

  return (
    <section className="w-full max-w-fit flex">
      <section className="flex flex-col gap-2">
        <select
          onChange={handleLanguageSelection}
          aria-label="languages translation dropdown"
          className="text-[0.8rem] w-full bg-[var(--dark)] cursor-pointer border-2 border-[var(--color-main)] p-1 rounded-lg bg-transparent"
          defaultValue="Translate Text"
        >
          <option className="text-black" hidden value="Translate Text">
            Pick a language
          </option>
          {targetLanguages.map((lang) => (
            <option
              onKeyDown={(e) => e.key === "Enter" && handleLanguageSelection}
              aria-label={lang.name}
              className="text-black"
              key={lang.code}
              value={lang.code}
            >
              {lang.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleTranslation}
          disabled={isLoading}
          aria-label="translate text button"
          className="text-[0.8rem] w-full whitespace-nowrap cursor-pointer text-center border-2 border-[var(--color-main)] bg-[var(--color-main)] p-1 rounded-lg hover:bg-[var(--color-lighter-main)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Translate text ({language})
        </button>

        {isLoading && (
          <p className="text-[10px] text-[var(--color-text-grey)] text-center">
            Translating...
          </p>
        )}
      </section>

      {translatedText && (
        <section className="mx-2 w-full">
          <p className="text-[0.6rem] font-bold">
            Translation - {translatedLanguage}
          </p>
          <section className="text-[0.8rem] border-2 p-2 flex flex-col gap-1 rounded-lg">
            <button
              onClick={handleClose}
              className="text-[0.55rem] font-bold ms-auto hover:underline hover:text-[var(--light)] text-[var(--color-text-grey)]"
            >
              Close
            </button>
            {translatedText}
          </section>
        </section>
      )}
    </section>
  );
}
