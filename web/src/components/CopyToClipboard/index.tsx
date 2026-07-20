import styles from "./styles.module.css";
import { useI18n } from "../../i18n";
import classNames from "classnames";
import { FaRegClipboard } from "react-icons/fa";
import { toast } from "react-toastify";

interface CopyToClipboardProps {
  text: string;
}

export function CopyToClipboard({ text }: CopyToClipboardProps) {
  const { t } = useI18n();

  return (
    <span
      className={classNames(styles.copy)}
      onClick={(e) => {
        navigator.clipboard.writeText(text);
        toast.success(
          <div>
            {t("toast.copied")}
            <br />
            {text}
          </div>,
        );
        e.stopPropagation();
      }}
    >
      <FaRegClipboard className={classNames("inlineIcon")} />
    </span>
  );
}
