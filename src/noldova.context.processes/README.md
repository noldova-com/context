# noldova.context.processes

Ends a process and every process it started, and returns only once they are
gone. A process is named by its id and its start time, so an id the system has
since given to another process is never ended. It also lists the machine's
processes, for ending processes you didn't start.

## Install

```bash
npm install @noldova/context.processes
```

## Use

```ts
import { spawn } from "node:child_process";

import "@noldova/context.core";
import { ProcessIdentity, ProcessTree, ProcessTreeEndOptions } from "@noldova/context.processes";

const server = spawn(process.execPath, ["server.js"], { detached: true });
const identity = await ProcessIdentity.readAsync(server.pid ?? 0);

if (!Object.isUndefined(identity))
  await ProcessTree.endAsync(identity, new ProcessTreeEndOptions(2000));
```

Read the identity while you own the process, such as right after starting it.
Start the root with `detached: true`, so on Linux and macOS it leads a process
group of its own and a process whose parent ended is still found through the
group.

`endAsync` finds the tree from the root: every process whose parent is in the
tree and that started no earlier than its parent, and, on Linux and macOS,
every process in the root's group. It stops each with `SIGSTOP` and lists the
tree again until nothing new appears, then ends them, with `SIGTERM` and the
grace first when one is given, and lists the tree every 50 ms until none of it
is left. It throws `ProcessTreeEndException`, naming what is left, when the
limit passes; the limit is 10 seconds by default.
A process is a member's child only when no process listed took the member's id
between the two starts, so an id passed on doesn't bring in a stranger's children.

`endDescendantsAsync` ends the same tree but leaves its root running, so a
process can end what it started without ending itself:

```ts
const own = await ProcessIdentity.readAsync(process.pid);

if (!Object.isUndefined(own))
  await ProcessTree.endDescendantsAsync(own);
```

`Processes.listAsync` lists every process on the machine, each with its id,
parent's id, group's id (`null` on Windows), whether it waits for its parent to
collect it, and its start time, so you can pick processes you never owned and
end each through its identity:

```ts
const processes = await Processes.listAsync();
const leftovers = processes.where(t => t.groupId === group && !t.isZombie);

for (const leftover of leftovers)
  await ProcessTree.endAsync(leftover.identity);
```

A `ProcessEntry` can be constructed, so code that takes its listing through a
type of its own can be tested with entries instead of real processes.

The processes are listed through one lister process, started on the first call
and kept for the rest of the process's life. The limit starts once it is ready,
so the first call in a process may first wait up to 45 seconds for it, which a
fresh Windows machine can take; a lister not ready by then throws
`ProcessesException`.

On Windows a process can't be stopped and has no polite request: the tree is
listed once more before the end, the grace is only waited out, each process is
ended with `TerminateProcess`, and a process that keeps starting others is
ended over several rounds. Windows has no process group, so a process whose parent ended before
the call is not found there.

## License

MIT; see `LICENSE`.
