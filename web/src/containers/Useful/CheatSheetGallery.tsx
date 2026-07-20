import { Modal } from "../../components/Modal";
import { useI18n } from "../../i18n";
import type { MessageKey } from "../../i18n/core";
import styles from "./styles.module.css";
import { useState } from "react";
import { FaExpand, FaExternalLinkAlt, FaTimes } from "react-icons/fa";
import { cheatSheets, type CheatSheet } from "./resources";

export function CheatSheetGallery() {
  const { t } = useI18n();
  const [selectedSheet, setSelectedSheet] = useState<CheatSheet | null>(null);
  const imageUrl = (sheet: CheatSheet) =>
    `${import.meta.env.BASE_URL}useful/${sheet.filename}`;
  const sheetText = (
    sheet: CheatSheet,
    field: "title" | "description" | "alt" | "attribution",
  ) => t(`useful.sheet.${sheet.id}.${field}` as MessageKey);

  return (
    <>
      <div className={styles.gallery}>
        {cheatSheets.map((sheet) => (
          <figure className={styles.sheetCard} key={sheet.id}>
            <button
              type="button"
              className={styles.sheetTrigger}
              onClick={() => setSelectedSheet(sheet)}
              aria-label={`${sheetText(sheet, "title")}. ${t("useful.openFullSize")}`}
            >
              <img
                className={styles.sheetPreview}
                src={imageUrl(sheet)}
                alt={sheetText(sheet, "alt")}
                loading="lazy"
              />
              <FaExpand aria-hidden={true} className={styles.expandIcon} />
            </button>
            <figcaption className={styles.sheetCaption}>
              <h3>{sheetText(sheet, "title")}</h3>
              <p>{sheetText(sheet, "description")}</p>
              <small>{sheetText(sheet, "attribution")}</small>
            </figcaption>
          </figure>
        ))}
      </div>
      {selectedSheet && (
        <Modal
          size="image"
          isOpen={true}
          contentLabel={sheetText(selectedSheet, "title")}
          onRequestClose={() => setSelectedSheet(null)}
          shouldReturnFocusAfterClose={true}
        >
          <div className={styles.previewBody}>
            <div className={styles.previewToolbar}>
              <a
                href={imageUrl(selectedSheet)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("useful.openOriginal")}
                <FaExternalLinkAlt aria-hidden={true} className="inlineIcon" />
              </a>
              <button
                type="button"
                autoFocus={true}
                onClick={() => setSelectedSheet(null)}
                aria-label={t("useful.closePreview")}
              >
                <FaTimes aria-hidden={true} />
              </button>
            </div>
            <button
              type="button"
              className={styles.previewImageButton}
              onClick={() => setSelectedSheet(null)}
              aria-label={t("useful.closePreview")}
            >
              <img
                className={styles.previewImage}
                src={imageUrl(selectedSheet)}
                alt={sheetText(selectedSheet, "alt")}
              />
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
