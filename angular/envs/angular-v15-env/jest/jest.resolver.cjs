module.exports = (path, options) => {
  // Call the defaultResolver, so we leverage its cache, error handling, etc.
  return options.defaultResolver(path, {
    ...options,
    // Use packageFilter to process parsed `package.json` before the resolution (see https://www.npmjs.com/package/resolve#resolveid-opts-cb)
    packageFilter: (pkg) => {
      const pkgNamesToTarget = new Set([
        'rxjs',
        '@firebase/auth',
        '@firebase/storage',
        '@firebase/functions',
        '@firebase/database',
        '@firebase/auth-compat',
        '@firebase/database-compat',
        '@firebase/app-compat',
        '@firebase/firestore',
        '@firebase/firestore-compat',
        '@firebase/messaging',
        '@firebase/util',
        'firebase',
      ]);

      if (pkgNamesToTarget.has(pkg.name)) {
        // eslint-disable-next-line no-param-reassign
        delete pkg.exports;
        // eslint-disable-next-line no-param-reassign
        delete pkg.module;
      }

      return pkg;
    },
  });
};
