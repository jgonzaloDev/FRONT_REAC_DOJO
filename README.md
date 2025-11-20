# Example App

This small Vite + React app demonstrates importing components from the `storybook-dojo-react` npm package.

To run locally (PowerShell on Windows):

```powershell
cd C:\DOJO\NEW\example-app
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

Notes:
- If the package exports different component names, update `src/App.jsx` to import the correct symbols.
- The package version in package.json is set to `*` to fetch the published version; pin a specific version if desired.
