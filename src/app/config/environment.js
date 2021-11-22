const BASE_DEV = "https://tangerineaws.tk/";
const BASE_AGNOSTIC = window.location.origin.includes("localhost")
  ? BASE_DEV
  : window.location.origin + "/";

export const defaultConfig = {
  BASE_URL_: BASE_AGNOSTIC,
  API_URL: BASE_AGNOSTIC + "api/",
  BASE_STORAGE_URL: BASE_AGNOSTIC + "files-storage-tools/",
};
