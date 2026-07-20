import { useI18n } from "../../i18n";
import type { MessageKey } from "../../i18n/core";
import styles from "./styles.module.css";
import classNames from "classnames";
import { FaArrowRight, FaExternalLinkAlt } from "react-icons/fa";
import { CheatSheetGallery } from "./CheatSheetGallery";
import {
  heistBranches,
  resourceCategories,
  resources,
  type ResourceCategoryId,
  type ResourceId,
} from "./resources";

const resourcesById = new Map(
  resources.map((resource) => [resource.id, resource] as const),
);

export default function UsefulContainer() {
  const { t } = useI18n();
  const categoryText = (id: ResourceCategoryId) =>
    t(`useful.category.${id}` as MessageKey);
  const resourceText = (id: ResourceId) =>
    t(`useful.resource.${id}.description` as MessageKey);

  return (
    <main className={styles.page}>
      <section id="useful-tools" aria-labelledby="useful-tools-title">
        <div className={styles.sectionHeading}>
          <h1 id="useful-tools-title">{t("useful.tools.title")}</h1>
          <p>{t("useful.tools.description")}</p>
        </div>
        {resourceCategories.map((category) => (
          <div
            className={styles.category}
            data-category={category.id}
            key={category.id}
          >
            <h3>{categoryText(category.id)}</h3>
            <div className={styles.resourceGrid}>
              {category.resourceIds.map((resourceId) => {
                const resource = resourcesById.get(resourceId);
                if (!resource) return null;
                const note = "note" in resource ? resource.note : null;
                const description = resourceText(resource.id);

                return (
                  <a
                    className={classNames(styles.resourceCard, {
                      [styles.featuredCard]: note === "featured",
                    })}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${resource.name}. ${description}. ${t("useful.externalLink")}`}
                    key={resource.id}
                  >
                    <span className={styles.resourceTitle}>
                      <strong>{resource.name}</strong>
                      <FaExternalLinkAlt aria-hidden={true} />
                    </span>
                    <span className={styles.resourceDescription}>
                      {description}
                    </span>
                    {note && (
                      <span className={styles.resourceFooter}>
                        <span className={styles.badge}>
                          {t(`useful.note.${note}` as MessageKey)}
                        </span>
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section id="useful-heist" aria-labelledby="useful-heist-title">
        <div className={styles.sectionHeading}>
          <h2 id="useful-heist-title">{t("useful.heist.title")}</h2>
          <p>{t("useful.heist.description")}</p>
        </div>
        <div className={styles.heistBranches}>
          {heistBranches.map((branch, branchIndex) => (
            <div className={styles.heistBranch} key={branchIndex}>
              <h3>
                {t(
                  branchIndex === 0
                    ? "useful.heist.branch1"
                    : "useful.heist.branch2",
                )}
              </h3>
              <ol>
                {branch.map((companion, index) => (
                  <li key={companion}>
                    <span>
                      {t(`useful.heist.companion.${companion}` as MessageKey)}
                    </span>
                    {index < branch.length - 1 && (
                      <FaArrowRight
                        aria-hidden={true}
                        className={styles.branchArrow}
                      />
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section id="useful-sheets" aria-labelledby="useful-sheets-title">
        <div className={styles.sectionHeading}>
          <h2 id="useful-sheets-title">{t("useful.sheets.title")}</h2>
          <p>{t("useful.sheets.description")}</p>
        </div>
        <CheatSheetGallery />
      </section>
    </main>
  );
}
