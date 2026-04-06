const IMPORT_MAP_KEY = "collabo-import-map";
const REMOVED_COLLABO_KEY = "collabo-import-removed";

type ImportMap = Record<string, number>;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function readImportMap(): ImportMap {
  return readJson<ImportMap>(IMPORT_MAP_KEY, {});
}

function writeImportMap(value: ImportMap) {
  writeJson(IMPORT_MAP_KEY, value);
}

function readRemovedCollabos(): number[] {
  return readJson<number[]>(REMOVED_COLLABO_KEY, []);
}

function writeRemovedCollabos(value: number[]) {
  writeJson(REMOVED_COLLABO_KEY, value);
}

export function markCollaboImported(collaboId: number, importedPlaylistId?: number | null) {
  const removed = readRemovedCollabos().filter((id) => id !== collaboId);
  writeRemovedCollabos(removed);

  if (!importedPlaylistId) return;

  const importMap = readImportMap();
  importMap[String(collaboId)] = importedPlaylistId;
  writeImportMap(importMap);
}

export function clearImportedPlaylist(playlistId: number) {
  const importMap = readImportMap();
  const matchedEntry = Object.entries(importMap).find(([, importedId]) => importedId === playlistId);
  if (!matchedEntry) return null;

  const [collaboId] = matchedEntry;
  delete importMap[collaboId];
  writeImportMap(importMap);

  const removed = new Set(readRemovedCollabos());
  removed.add(Number(collaboId));
  writeRemovedCollabos([...removed]);

  return Number(collaboId);
}

export function isCollaboImported(collaboId: number, serverHasImported?: boolean) {
  const removed = new Set(readRemovedCollabos());
  if (removed.has(collaboId)) return false;

  const importMap = readImportMap();
  if (typeof importMap[String(collaboId)] === "number") return true;

  return !!serverHasImported;
}
