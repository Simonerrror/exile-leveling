const REMOTE_READER_URL = "https://r.jina.ai";
const BUILD_ID = "[A-Za-z0-9_-]+";

export function rewritePobUrl(value: string) {
  let url: URL;

  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    url.search ||
    url.hash
  ) {
    return null;
  }

  const pobbMatch = new RegExp(`^/(${BUILD_ID})/?$`).exec(url.pathname);
  if (url.hostname === "pobb.in" && pobbMatch) {
    return `pobb.in/${pobbMatch[1]}/raw`;
  }

  const poeNinjaMatch = new RegExp(`^/pob/(${BUILD_ID})/?$`).exec(url.pathname);
  if (url.hostname === "poe.ninja" && poeNinjaMatch) {
    return `poe.ninja/pob/raw/${poeNinjaMatch[1]}`;
  }

  return null;
}

export function extractRemotePobCode(value: string) {
  const markdownContent = /^Markdown Content:\s*\r?\n/m.exec(value);
  if (!markdownContent || markdownContent.index === undefined) return value;

  return value.slice(markdownContent.index + markdownContent[0].length).trim();
}

export async function fetchPobCode(value: string) {
  const remoteUrl = rewritePobUrl(value);
  if (!remoteUrl) {
    if (/^\s*https?:\/\//i.test(value)) {
      throw new Error("unsupported build URL");
    }

    return value;
  }

  const response = await fetch(`${REMOTE_READER_URL}/http://${remoteUrl}`);
  if (!response.ok) throw new Error("download failed");

  return extractRemotePobCode(await response.text());
}
