import { formStyles } from "../../styles";
import { useI18n } from "../../i18n";
import { type UrlRewriter, fetchStringOrUrl } from "../../utility";
import { Modal, TextModal } from "../Modal";
import { Workspace } from "./Workspace";
import styles from "./styles.module.css";
import classNames from "classnames";
import { buildRouteSource, getRouteFiles } from "common";
import type { RouteData } from "common";
import React from "react";
import { useEffect, useState } from "react";
import { BiHelpCircle } from "react-icons/bi";
import flattenChildren from "react-keyed-flatten-children";
import { toast } from "react-toastify";
import { FragmentDescriptionLookup } from "../../../../common/src/route-processing/fragment/language";

function cloneRouteFiles(routeFiles: RouteData.RouteFile[]) {
  return routeFiles.map((x) => ({ ...x }));
}

const URL_REWRITERS: UrlRewriter[] = [
  (url) => {
    const match = /pastebin\.com\/(.+)$/.exec(url);
    if (!match) return null;

    return `pastebin.com/raw/${match[1]}`;
  },
];

interface RouteEditorProps {
  routeFiles: RouteData.RouteFile[];
  onSubmit: (routeFiles: RouteData.RouteFile[]) => void;
  onReset: () => void;
}

export function RouteEditor({
  routeFiles,
  onSubmit,
  onReset,
}: RouteEditorProps) {
  const { t } = useI18n();
  const [workingFiles, setWorkingFiles] = useState<RouteData.RouteFile[]>([]);
  const [importIsOpen, setImportIsOpen] = useState<boolean>(false);
  const [guideIsOpen, setGuideIsOpen] = useState<boolean>(false);

  useEffect(() => {
    setWorkingFiles(cloneRouteFiles(routeFiles));
  }, [routeFiles]);

  const submitWorkingFiles = () => {
    onSubmit(getRouteFiles(workingFiles.map((x) => x.contents)));
  };

  useEffect(() => {
    const handler = (evt: KeyboardEvent) => {
      if ((evt.metaKey || evt.ctrlKey) && evt.key === "s") {
        evt.preventDefault();
        submitWorkingFiles();
      }
    };
    document.addEventListener("keydown", handler);

    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, [workingFiles]);

  return (
    <>
      <TextModal
        size="large"
        label={t("route.importTitle")}
        isOpen={importIsOpen}
        onRequestClose={() => setImportIsOpen(false)}
        onSubmit={(routeOrUrl) =>
          toast.promise(
            async () => {
              if (!routeOrUrl) return;
              const routeSrc = await fetchStringOrUrl(
                routeOrUrl,
                URL_REWRITERS,
              );

              const routeFiles = getRouteFiles([routeSrc]);
              onSubmit(routeFiles);
            },
            {
              pending: t("route.importing"),
              success: t("route.importSuccess"),
              error: t("route.importFailed"),
            },
          )
        }
      />
      <Modal
        size="large"
        isOpen={guideIsOpen}
        onRequestClose={() => setGuideIsOpen(false)}
      >
        <HelpPage />
      </Modal>
      <div className={classNames(formStyles.form, styles.editorForm)}>
        <Workspace
          workingFiles={workingFiles}
          isDirty={(workingFile, i) =>
            i < routeFiles.length &&
            routeFiles[i].contents !== workingFile.contents
          }
          onUpdate={setWorkingFiles}
        />
        <div className={classNames(formStyles.groupRight)}>
          <BiHelpCircle
            size={24}
            onClick={() => {
              setGuideIsOpen(true);
            }}
          />
          <button
            className={classNames(formStyles.formButton)}
            onClick={() => {
              const routeSource = buildRouteSource(workingFiles);
              navigator.clipboard.writeText(routeSource);
              toast.success(t("toast.exported"));
            }}
          >
            {t("route.export")}
          </button>
          <button
            className={classNames(formStyles.formButton)}
            onClick={() => {
              setImportIsOpen(true);
            }}
          >
            {t("route.import")}
          </button>
          <button
            className={classNames(formStyles.formButton)}
            onClick={() => {
              setWorkingFiles(cloneRouteFiles(routeFiles));
              onReset();
            }}
          >
            {t("route.reset")}
          </button>
          <button
            className={classNames(formStyles.formButton)}
            onClick={() => {
              submitWorkingFiles();
            }}
          >
            {t("route.save")}
          </button>
        </div>
      </div>
      <hr />
    </>
  );
}

function HelpPage() {
  const fragmentDescriptions: React.ReactNode[] = Object.entries(
    FragmentDescriptionLookup,
  ).map(([key, variants], i) => (
    <React.Fragment key={key}>
      {variants.map((variant, j) => (
        <React.Fragment key={`variant-${j}`}>
          {i !== 0 && <hr />}
          <div>
            <span className="token keyword control-flow">{"{"}</span>
            <span className="token keyword">{key}</span>
            {variant.parameters.map((param, i) => (
              <React.Fragment key={`variant-parameters-${i}`}>
                <span className="token keyword control-flow">{"|"}</span>
                <span className="token property">{param.name}</span>
              </React.Fragment>
            ))}
            <span className="token keyword control-flow">{"}"}</span>
            <br />
            <span>{variant.description}</span>
            <br />
            {variant.parameters.map((param, j) => (
              <React.Fragment key={`variant-description-${j}`}>
                <span className="token property">{param.name}</span>:{" "}
                {param.description}
                <br />
              </React.Fragment>
            ))}
          </div>
        </React.Fragment>
      ))}
    </React.Fragment>
  ));

  return (
    <div className={classNames(styles.help)}>
      {flattenChildren(fragmentDescriptions)}
    </div>
  );
}
