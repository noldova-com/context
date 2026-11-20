/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */


import { execFile } from "node:child_process";

import { Assert, TestClass, TestMethod, Timeout } from "@noldova/context.testing";
import { ProcessTree } from "@noldova/context.testing/services/execution/process-tree.js";

@TestClass
export class ProcessTreeTests {
  private static readonly PROBE_SCRIPT: string = "$s = [DateTime]::Now; $p = [Diagnostics.Process]::GetCurrentProcess().StartTime; 'start-to-script {0:N0} ms' -f ($s - $p).TotalMilliseconds; $a = [DateTime]::Now; Import-Module CimCmdlets; 'import {0:N0} ms' -f ([DateTime]::Now - $a).TotalMilliseconds; $b = [DateTime]::Now; $all = Get-CimInstance -Query 'SELECT ProcessId, ParentProcessId, CreationDate, Name FROM Win32_Process'; 'query {0:N0} ms, {1} processes' -f ([DateTime]::Now - $b).TotalMilliseconds, @($all).Count; $c = [DateTime]::Now; $all = Get-CimInstance -Query 'SELECT ProcessId, ParentProcessId, CreationDate, Name FROM Win32_Process'; 'query2 {0:N0} ms' -f ([DateTime]::Now - $c).TotalMilliseconds; $d = [DateTime]::Now; $all = Get-CimInstance -ClassName Win32_Process; 'fullquery {0:N0} ms' -f ([DateTime]::Now - $d).TotalMilliseconds";

  @Timeout(600_000)
  @TestMethod
  public async timesTheWindowsListingPhasesAsync(): Promise<void> {
    if (process.platform !== "win32")
      return;

    const lines: string[] = [];
    for (const round of [1, 2]) {
      const start = performance.now();
      const output = await new Promise<string>((resolve, reject) => {
        execFile("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", ProcessTreeTests.  private static readonly PROBE_SCRIPT: string = "$s = [DateTime]::Now; $p = [Diagnostics.Process]::GetCurrentProcess().StartTime; 'start-to-script {0:N0} ms' -f ($s - $p).TotalMilliseconds; $a = [DateTime]::Now; Import-Module CimCmdlets; 'import {0:N0} ms' -f ([DateTime]::Now - $a).TotalMilliseconds; $b = [DateTime]::Now; $all = Get-CimInstance -Query 'SELECT ProcessId, ParentProcessId, CreationDate, Name FROM Win32_Process'; 'query {0:N0} ms, {1} processes' -f ([DateTime]::Now - $b).TotalMilliseconds, @($all).Count; $c = [DateTime]::Now; $all = Get-CimInstance -Query 'SELECT ProcessId, ParentProcessId, CreationDate, Name FROM Win32_Process'; 'query2 {0:N0} ms' -f ([DateTime]::Now - $c).TotalMilliseconds; $d = [DateTime]::Now; $all = Get-CimInstance -ClassName Win32_Process; 'fullquery {0:N0} ms' -f ([DateTime]::Now - $d).TotalMilliseconds";_SCRIPT], { encoding: "utf8", windowsHide: true },
          (error, standardOutput, standardError) => Object.isNull(error) ? resolve(standardOutput + standardError) : reject(error));
      });
      lines.push(`round ${round}: total ${Math.round(performance.now() - start)} ms; ${output.trim().split(/\r?\n/u).join("; ")}`);
      process.stderr.write(`ARM64-TIMING ${lines.at(-1) ?? String.empty}\n`);
    }

    for (const round of [1, 2, 3]) {
      const start = performance.now();
      await new ProcessTree(process.platform).listDescendantsAsync(process.pid);
      lines.push(`listing ${round}: ${Math.round(performance.now() - start)} ms`);
      process.stderr.write(`ARM64-TIMING ${lines.at(-1) ?? String.empty}\n`);
    }

    Assert.fail(`ARM64-TIMING ${lines.join(" | ")}`);
  }
}
