# noldova.context

The `ctx` command. It reads the project file (`.ctxp`), loads the command
providers the project names, and runs the command asked for. It has no command
of its own: `build`, `run` and the others come from the SDK and the tools.

## Install

```bash
npm install @noldova/context
```

## Use

```bash
ctx --help
ctx run -- --port 8080
ctx build --project app.ctxp
```

`ctx` reads the project file `--project` names, or the one `.ctxp` in the
folder it runs in; none or several is an error. With no command, or `-h` or
`--help`, it lists the commands.

The project's `sdk` names the one SDK, `noldova.context.sdk` when left out, and
`tools` names the other providers:

```json
{
  "name": "noldova.context.app",
  "kind": "executable",
  "sdk": "noldova.context.sdk",
  "tools": ["noldova.context.data.tools"],
  "entry": { "source": "main.ts", "class": "Program" }
}
```

Each provider is installed for the project as its npm package, such as
`@noldova/context.sdk`. Two providers offering a command of the same name is
an error.

`entry` tells the SDK's `run` which class's static `main` starts the app;
`source` is `main.ts` when left out, and `class` may be left out when the module
exports one class with a static `main`.

## Write a provider

A provider exports, from its public API, classes that extend `Command`, each
with a constructor that takes no arguments:

```ts
import { Command, type CommandContext } from "@noldova/context";

export class HelloCommand extends Command {
  public override readonly name = "hello";
  public override readonly description = "Says hello.";

  public override async runAsync(context: CommandContext): Promise<number> {
    context.output.writeLine(`Hello from ${context.project.name}.`);
    return 0;
  }
}
```

`ctx` reads only the first word as the command. Everything after it belongs to
the command, so subcommands at any depth and `ctx <command> --help` are its own
to handle, and `ctx --help` lists only the first words.

A failure `ctx` reports extends `CommandHostException`: its message goes to the
error output, and the exit code is 1.

## License

MIT; see `LICENSE`.
