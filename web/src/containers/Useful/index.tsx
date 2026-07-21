import { useMemo, useState } from "react";
import { FaArrowRight, FaExternalLinkAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n";
import type { MessageKey } from "../../i18n/core";
import { CheatSheetGallery } from "./CheatSheetGallery";
import {
  heistBranches,
  resourceCategories,
  resources,
  type ResourceId,
} from "./resources";
import {
  internalToolCategories,
  internalTools,
  matchesToolQuery,
  type InternalTool,
} from "./tools";
import styles from "./styles.module.css";

const resourcesById = new Map(
  resources.map((resource) => [resource.id, resource] as const),
);
export default function UsefulContainer() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const visibleInternalTools = useMemo(
    () =>
      internalTools.filter((tool) =>
        matchesToolQuery(tool, query, {
          [tool.titleKey]: t(tool.titleKey),
          [tool.descriptionKey]: t(tool.descriptionKey),
          [tool.keywordsKey]: t(tool.keywordsKey),
        }),
      ),
    [query, t],
  );
  const visibleResources = useMemo(
    () =>
      resources.filter((resource) => {
        if (normalizedQuery === "") return true;
        const description = t(
          `useful.resource.${resource.id}.description` as MessageKey,
        );
        return `${resource.name} ${resource.domain} ${description}`
          .toLocaleLowerCase()
          .includes(normalizedQuery);
      }),
    [normalizedQuery, t],
  );
  const visibleResourceIds = new Set(
    visibleResources.map(({ id }) => id as ResourceId),
  );

  return (
    <main className={styles.page}>
      <header className={styles.catalogHeader}>
        <div>
          <p className={styles.eyebrow}>PoE Tools</p>
          <h1>{t("useful.title")}</h1>
          <p>{t("useful.intro")}</p>
        </div>
        <label className={styles.searchBox}>
          <span>{t("tools.search")}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("tools.search")}
          />
        </label>
      </header>

      <div className={styles.catalogLayout}>
        <nav className={styles.categoryRail} aria-label={t("useful.jumpLabel")}>
          {internalToolCategories.map((category) => (
            <a href={`#catalog-${category.id}`} key={category.id}>
              {t(category.titleKey)}
            </a>
          ))}
          <a href="#catalog-external">{t("tools.external.title")}</a>
          <a href="#useful-heist">{t("useful.heist.title")}</a>
          <a href="#useful-sheets">{t("useful.sheets.title")}</a>
        </nav>

        <div className={styles.catalogContent}>
          {(["tools", "reference"] as const).map((category) => {
            const tools = visibleInternalTools.filter(
              (tool) => tool.category === category,
            );
            if (tools.length === 0) return null;
            return (
              <section
                id={`catalog-${category}`}
                className={styles.catalogSection}
                key={category}
              >
                <h2>{t(`tools.category.${category}` as MessageKey)}</h2>
                <div className={styles.internalGrid}>
                  {tools.map((tool) => (
                    <InternalToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </section>
            );
          })}

          {visibleInternalTools.length === 0 &&
            visibleResources.length === 0 && (
              <p className={styles.emptyState}>{t("tools.noResults")}</p>
            )}

          {visibleResources.length > 0 && (
            <section id="catalog-external" className={styles.catalogSection}>
              <div className={styles.sectionHeading}>
                <h2>{t("tools.external.title")}</h2>
                <p>{t("tools.external.description")}</p>
              </div>
              {resourceCategories.map((category) => {
                const resourceIds = category.resourceIds.filter((id) =>
                  visibleResourceIds.has(id),
                );
                if (resourceIds.length === 0) return null;
                return (
                  <div
                    className={styles.category}
                    data-category={category.id}
                    key={category.id}
                  >
                    <h3>
                      {t(`useful.category.${category.id}` as MessageKey)}
                    </h3>
                    <div className={styles.resourceGrid}>
                      {resourceIds.map((resourceId) => (
                        <ExternalResourceCard
                          id={resourceId}
                          key={resourceId}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          )}
        </div>
      </div>

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

function InternalToolCard({ tool }: { tool: InternalTool }) {
  const { t } = useI18n();
  return (
    <Link
      className={styles.internalCard}
      data-accent={tool.accent}
      to={tool.href}
    >
      <span className={styles.cardIcon} aria-hidden={true}>
        <img src={tool.icon} alt="" />
      </span>
      <span className={styles.cardContent}>
        <strong>{t(tool.titleKey)}</strong>
        <span>{t(tool.descriptionKey)}</span>
      </span>
    </Link>
  );
}

function ExternalResourceCard({ id }: { id: ResourceId }) {
  const { t } = useI18n();
  const resource = resourcesById.get(id);
  if (!resource) return null;
  const description = t(`useful.resource.${resource.id}.description` as MessageKey);

  return (
    <a
      className={styles.resourceCard}
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${resource.name}. ${description}. ${t("useful.externalLink")}`}
    >
      <span className={styles.cardIcon} aria-hidden={true}>
        <img
          src={resource.icon}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </span>
      <span className={styles.cardContent}>
        <span className={styles.resourceTitle}>
          <strong>{resource.name}</strong>
          <FaExternalLinkAlt aria-hidden={true} />
        </span>
        <span className={styles.resourceDescription}>{description}</span>
      </span>
    </a>
  );
}
