import { atomWithStorage, RESET } from "jotai/utils";
import { versionedStorage } from ".";
import { globImportLazy } from "../utility";
import { localeAtom } from "./locale";
import { selectRouteSources } from "./route-sources";
import { type RouteData } from "common";
import { atom } from "jotai";

const ROUTE_PROGRESS_VERSION = 1;

function routeSourceKey(key: string): string {
  const segments = key.replaceAll("\\", "/").split("/");
  const filename = segments.pop();
  const locale = segments.pop();

  if (
    filename === undefined ||
    locale === undefined ||
    !/^act-\d+\.txt$/.test(filename)
  ) {
    throw new Error(`invalid route source path: ${key}`);
  }

  return `${locale}/${filename.slice(0, -".txt".length)}`;
}

export const RouteSourceLookup = globImportLazy<string>(
  import.meta.glob("/../common/data/routes/*/*.txt", {
    query: "?raw",
    import: "default",
  }),
  routeSourceKey,
  (value) => value,
);

const routeFileSourcesAtom = atom(async (get) =>
  selectRouteSources(RouteSourceLookup, get(localeAtom)),
);

async function loadDefaultRouteFiles(routeSources: string[]) {
  const { getRouteFiles } = await import("common");

  return getRouteFiles(routeSources);
}

const routeFilesAtom = atomWithStorage<RouteData.RouteFile[] | null>(
  "route-files",
  null,
  versionedStorage(ROUTE_PROGRESS_VERSION),
);

export const routeFilesSelector = atom(
  async (get) => {
    const data = get(routeFilesAtom);

    if (data === null) {
      return await loadDefaultRouteFiles(await get(routeFileSourcesAtom));
    }

    return data;
  },
  (_get, set, value: RouteData.RouteFile[] | typeof RESET) => {
    set(routeFilesAtom, value);
  },
);
