import { formStyles } from "../../styles";
import { useI18n } from "../../i18n";
import {
  type UrlRewriter,
  fetchStringOrUrl,
  getRewriteUrl,
} from "../../utility";
import { TextModal } from "../Modal";
import { type PobData, processPob } from "./pob";
import classNames from "classnames";
import { useState } from "react";
import { toast } from "react-toastify";

const URL_REWRITERS: UrlRewriter[] = [
  (url) => {
    const match = /pastebin\.com\/(.+)$/.exec(url);
    if (!match) return null;

    return `pastebin.com/raw/${match[1]}`;
  },
  (url) => {
    const match = /poe\.ninja\/pob\/(.+)$/.exec(url);
    if (!match) return null;

    return `poe.ninja/pob/raw/${match[1]}`;
  },
  (url) => {
    const match = /pobb\.in\/(.+)$/.exec(url);
    if (!match) return null;

    return `pobb.in/${match[1]}/raw`;
  },
  (url) => {
    const match = /youtube.com\/redirect\?.+?q=(.+?)(?:&|$)/.exec(url);
    if (!match) return null;
    const redirectUrl = decodeURIComponent(match[1]);

    return getRewriteUrl(redirectUrl, URL_REWRITERS);
  },
];

interface BuildImportFormProps {
  onSubmit: (pobData: PobData, pobCode: string) => void;
  onReset: () => void;
}

export function BuildImportForm({ onSubmit, onReset }: BuildImportFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useI18n();

  return (
    <>
      <TextModal
        label={t("build.pobCode")}
        hint={t("build.pobHint")}
        size="small"
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        onSubmit={(pobCodeOrUrl) =>
          toast.promise(
            async () => {
              if (!pobCodeOrUrl) return Promise.reject("invalid pobCodeOrUrl");
              const pobCode = await fetchStringOrUrl(
                pobCodeOrUrl,
                URL_REWRITERS,
              );

              const pobData = processPob(pobCode);
              if (!pobData) return Promise.reject("parsing failed");

              onSubmit(pobData, pobCode);
            },
            {
              pending: t("build.importing"),
              success: t("build.importSuccess"),
              error: t("build.importFailed"),
            },
          )
        }
      />
      <div className={classNames(formStyles.groupRight)}>
        <button
          className={classNames(formStyles.formButton)}
          onClick={() => {
            onReset();
          }}
        >
          {t("build.reset")}
        </button>
        <button
          className={classNames(formStyles.formButton)}
          onClick={() => {
            setIsOpen(true);
          }}
        >
          {t("build.import")}
        </button>
      </div>
    </>
  );
}
