# noldova.context.sdk

The development commands for `ctx`: `ctx build` builds a project and the
projects it depends on, each with the TypeScript compiler installed for it.

## Install

```bash
npm install --save-dev @noldova/context.sdk typescript
```

`ctx` loads it as the project's SDK: `noldova.context.sdk` is the `.ctxp`
`sdk` when the field is left out.

## Use

```bash
ctx build
ctx build --noEmit
```

`ctx build` runs each project's `tsc` on the `tsconfig.json` beside its
`.ctxp`, unchanged. Every argument goes to `tsc` as given, and `tsc`'s output
is shown as it comes. It returns 1 when `tsc` reports a failure; a project
with no `tsconfig.json` or no `typescript` package installed fails, too, and
`ctx` prints why. `ctx build --help` shows its use.

Before `tsc`, `ctx build` runs the plugins of the packages the project names
in `dependencies.packages`. A plugin changes a copy of the source in
`_build/.generated`, never your files: `tsc` checks your source as you wrote
it, then compiles the copy into your `outDir`. Errors, and stack traces run
with `node --enable-source-maps`, point at your source. Such a project's
`tsconfig.json`, or one it extends, sets `rootDir` and `outDir`. No package
brings a plugin yet.

The projects it depends on are the `.ctxp` files its `dependencies.projects`
names, each a path relative to the project file that names it, with forward
slashes:

```json
{
  "name": "notes.web",
  "kind": "executable",
  "dependencies": {
    "projects": ["../notes/notes.ctxp"]
  }
}
```

It builds each of them before the projects that depend on them, in the order
they are listed, and stops at the first that fails. It refuses, before any
build, a path that isn't exact (case included), a project listed twice, two
projects with one name, a cycle, and an executable as a dependency.

## License

MIT; see `LICENSE`.
