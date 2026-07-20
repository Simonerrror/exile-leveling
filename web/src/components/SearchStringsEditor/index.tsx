import { useAtom } from "jotai";
import { useI18n } from "../../i18n";
import { searchStringsAtom } from "../../state/search-strings";
import { formStyles } from "../../styles";
import { CodeEditor } from "../CodeEditor";
import styles from "./styles.module.css";
import classNames from "classnames";
import { type Grammar } from "prismjs";

const SearchStringGrammar: Grammar = {
  comment: /#.*/,
};

export function SearchStringsEditor() {
  const [searchStrings, setSearchStrings] = useAtom(searchStringsAtom);
  const { t } = useI18n();

  return (
    <div className={classNames(formStyles.formRow)}>
      <label>
        {t("search.strings")} {"("}
        <a href="https://poe.re/" target="_blank">
          Path of Exile Regex
        </a>
        {/* TODO Should add some hints for alias format */}
        {")"}
      </label>
      <CodeEditor
        className={classNames(styles.input)}
        grammar={SearchStringGrammar}
        value={searchStrings?.join("\n") || ""}
        onValueChange={(value) => {
          if (value.length == 0) setSearchStrings(null);
          else setSearchStrings(value.split(/\r\n|\r|\n/));
        }}
      />
    </div>
  );
}
