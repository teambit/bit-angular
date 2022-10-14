import { join, dirname } from 'path';
import { existsSync } from 'fs';

export function resolver(extensions?: string[]) {
  const _extensions = ['ts', 'tsx', ...(extensions ?? [])];

  const resolveFile = (resolved: string) => {
    for (const extension of _extensions) {
      const file = `${resolved}.${extension}`;
      if (existsSync(file)) {
        return file;
      }
    }
  };

  return function resolveId(id: string, origin: string | undefined) {
    if (!origin || id.includes('node_modules')) {
      return id;
    }
    const resolved = join(dirname(origin), id);
    const file = resolveFile(resolved);
    if (file) {
      return file;
    }
  };
}
