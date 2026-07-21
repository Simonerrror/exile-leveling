import { useAtomValue } from "jotai";
import { useI18n } from "../../i18n";
import { pobCodeAtom } from "../../state/pob-code";
import { routeSelector } from "../../state/route";
import { routeFilesSelector } from "../../state/route-files";
import { borderListStyles, interactiveStyles } from "../../styles";
import { trackEvent } from "../../utility/telemetry";
import styles from "./styles.module.css";
import classNames from "classnames";
import React, { useEffect, useState } from "react";
import {
  FaBars,
  FaCode,
  FaGithub,
  FaHome,
  FaMap,
  FaRegClipboard,
  FaTools,
  FaUndoAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAtomCallback } from "jotai/utils";
import { gemProgressFamily } from "../../state/gem-progress";
import { routeProgressFamily } from "../../state/route-progress";
import { sectionCollapseFamily } from "../../state/section-collapse";
import { LocaleSelector } from "./LocaleSelector";

interface NavbarItemProps {
  label: string;
  icon?: React.ReactNode;
  expand: boolean;
  onClick: () => void;
}

function NavbarItem({ label, expand, icon, onClick }: NavbarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(styles.navItem, styles.navElement, {
        [styles.expand]: expand,
        [borderListStyles.item]: expand,
        [interactiveStyles.activeSecondary]: !expand,
        [interactiveStyles.hoverPrimary]: expand,
      })}
    >
      {icon}
      {label}
    </button>
  );
}

interface NavbarProps {}

export function Navbar({}: NavbarProps) {
  const [navExpand, setNavExpand] = useState<boolean>(false);
  const navigate = useNavigate();
  const { t } = useI18n();

  const clipboardRoute = useAtomCallback(async (get) => {
    const route = await get(routeSelector);
    const pobCode = get(pobCodeAtom);

    const output =
      pobCode === null
        ? [...route, `pob-code:none`]
        : [...route, `pob-code:${pobCode}`];
    navigator.clipboard.writeText(JSON.stringify(output));
  });

  const reset = useAtomCallback((_get, set) => {
    set(routeProgressFamily.clear);
    set(gemProgressFamily.clear);
    set(sectionCollapseFamily.clear);
  });

  const routeFiles = useAtomValue(routeFilesSelector);

  return (
    <div
      className={classNames(styles.navbar, {
        [styles.expand]: navExpand,
      })}
    >
      <div
        className={classNames(styles.navHolder, {
          [styles.expand]: navExpand,
        })}
      >
        <button
          type="button"
          aria-label={t("nav.menu")}
          onClick={() => setNavExpand(!navExpand)}
        >
          <FaBars
            aria-hidden={true}
            className={classNames(
              styles.navIcon,
              interactiveStyles.activePrimary,
            )}
            display="block"
          />
        </button>
        <div
          className={classNames(styles.navMain, {
            [styles.expand]: navExpand,
          })}
        >
          <div
            className={classNames(styles.navItems, {
              [styles.expand]: navExpand,
            })}
          >
            <button
              type="button"
              className={classNames(styles.brand, styles.navElement)}
              onClick={() => {
                navigate("/");
                setNavExpand(false);
              }}
            >
              PoE Tools
            </button>
            <NavbarItem
              label={t("nav.home")}
              expand={navExpand}
              icon={<FaHome className={classNames("inlineIcon")} />}
              onClick={() => {
                navigate("/");
                setNavExpand(false);
              }}
            />
            <NavbarItem
              label={t("nav.leveling")}
              expand={navExpand}
              icon={<FaMap className={classNames("inlineIcon")} />}
              onClick={() => {
                navigate("/leveling");
                setNavExpand(false);
              }}
            />
            <NavbarItem
              label={t("nav.regex")}
              expand={navExpand}
              icon={<FaCode className={classNames("inlineIcon")} />}
              onClick={() => {
                navigate("/regex");
                setNavExpand(false);
              }}
            />
            <NavbarItem
              label={t("nav.build")}
              expand={navExpand}
              icon={<FaTools className={classNames("inlineIcon")} />}
              onClick={() => {
                navigate("/build");
                setNavExpand(false);
              }}
            />
            <NavAccordion label={t("nav.sections")} navExpand={navExpand}>
              {routeFiles.map((x, i) => (
                <NavbarItem
                  key={i}
                  label={x.name}
                  expand={navExpand}
                  onClick={() => {
                    navigate(`/leveling#section-${i}`);
                    setNavExpand(false);
                  }}
                />
              ))}
            </NavAccordion>
            <NavbarItem
              label={t("nav.editRoute")}
              expand={navExpand}
              icon={<FaTools className={classNames("inlineIcon")} />}
              onClick={() => {
                navigate(`/edit-route`);
                setNavExpand(false);
              }}
            />
            <NavbarItem
              label={t("nav.resetProgress")}
              expand={navExpand}
              icon={<FaUndoAlt className={classNames("inlineIcon")} />}
              onClick={() => {
                reset();
                setNavExpand(false);
              }}
            />
            <NavbarItem
              label={t("nav.thirdPartyExport")}
              expand={navExpand}
              icon={<FaRegClipboard className={classNames("inlineIcon")} />}
              onClick={() => {
                clipboardRoute();
                trackEvent({ name: "3rd-Party Export" });
                toast.success(t("toast.exported"));
                setNavExpand(false);
              }}
            />
            <NavbarItem
              label={t("nav.projectGithub")}
              expand={navExpand}
              icon={<FaGithub className={classNames("inlineIcon")} />}
              onClick={() => {
                window
                  .open(
                    "https://github.com/Simonerrror/exile-leveling",
                    "_blank",
                  )
                  ?.focus();
                setNavExpand(false);
              }}
            />
          </div>
          {navExpand && <hr />}
          {navExpand && <LocaleSelector />}
        </div>
      </div>
      <hr />
    </div>
  );
}

interface NavAccordionProps {
  label: string;
  navExpand: boolean;
}

function NavAccordion({
  label,
  navExpand,
  children,
}: React.PropsWithChildren<NavAccordionProps>) {
  const [accordionExpand, setAccordionExpand] = useState<boolean>(false);

  useEffect(() => {
    setAccordionExpand(false);
  }, [navExpand]);
  return (
    <>
      <NavbarItem
        label={label}
        expand={navExpand}
        onClick={() => {
          setAccordionExpand(!accordionExpand);
        }}
      />
      {accordionExpand && <hr />}
      <div
        className={classNames(styles.navAccordion, styles.navItems, {
          [styles.expand]: accordionExpand,
        })}
      >
        {children}
      </div>
      {accordionExpand && <hr />}
    </>
  );
}
