# noldova.context.tooling

The repository's own release tooling: the steps of the npm release workflow,
`ReleaseService`, with the archive reader and GitHub client they use. The
release entry point, `scripts/release.ts`, runs it. It is built, installed,
tested and covered like the other packages, and the release never publishes it.

## Use

```ts
import { type IReleaseHost, PackageInfo, ReleaseService } from "@noldova/context.tooling";

export async function checkArchivesAsync(host: IReleaseHost, commit: string): Promise<void> {
  const packagesInfo = [new PackageInfo("noldova.context.json", "noldova.context.json", "@noldova/context.json", true)];
  await new ReleaseService(host, packagesInfo).runAsync(["check", "_packages", "0.0.3", commit]);
}
```

The host supplies the environment, git, npm, HTTP requests, the log and the
clock, so tests run the release against fakes. The entry point runs this
package's TypeScript source directly with Node's type stripping, so the publish
job installs nothing; the package therefore uses only Node's own modules. The
declaration file `api/index.d.ts` documents every member with its contract and
examples.

## License

MIT; see `LICENSE`.
