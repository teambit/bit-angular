export function resolver(extensions?: string[]) {
  return function resolveId(id: string, origin: string | undefined) {
    if (!origin || id.includes('node_modules')) {
      return id;
    }
    // anything else is to be considered external and not bundled
    return false;
  }
}
