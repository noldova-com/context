/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */


import { execFile } from "node:child_process";

import { Assert, TestClass, TestMethod, Timeout } from "@noldova/context.testing";

@TestClass
export class ProcessTreeTests {
  private static readonly SCRIPTS: readonly string[] = [
    "$s = [DateTime]::Now; $p = [Diagnostics.Process]::GetCurrentProcess().StartTime; 'start-to-script {0:N0} ms' -f ($s - $p).TotalMilliseconds; $a = [DateTime]::Now; $all = Get-WmiObject -Query 'SELECT ProcessId, ParentProcessId, CreationDate, Name FROM Win32_Process'; 'wmiobject {0:N0} ms, {1} processes' -f ([DateTime]::Now - $a).TotalMilliseconds, @($all).Count",
    "$s = [DateTime]::Now; $p = [Diagnostics.Process]::GetCurrentProcess().StartTime; 'start-to-script {0:N0} ms' -f ($s - $p).TotalMilliseconds; $a = [DateTime]::Now; Add-Type -AssemblyName System.Management; $all = (New-Object System.Management.ManagementObjectSearcher('SELECT ProcessId, ParentProcessId, CreationDate, Name FROM Win32_Process')).Get(); 'searcher {0:N0} ms, {1} processes' -f ([DateTime]::Now - $a).TotalMilliseconds, $all.Count",
    "$s = [DateTime]::Now; $p = [Diagnostics.Process]::GetCurrentProcess().StartTime; 'start-to-script {0:N0} ms' -f ($s - $p).TotalMilliseconds; $a = [DateTime]::Now; $all = Get-CimInstance -Query 'SELECT ProcessId, ParentProcessId, CreationDate, Name FROM Win32_Process'; 'cim {0:N0} ms, {1} processes' -f ([DateTime]::Now - $a).TotalMilliseconds, @($all).Count",
    "$s = [DateTime]::Now; $p = [Diagnostics.Process]::GetCurrentProcess().StartTime; 'start-to-script {0:N0} ms' -f ($s - $p).TotalMilliseconds; $a = [DateTime]::Now; $all = Get-WmiObject -Query 'SELECT ProcessId, ParentProcessId, CreationDate, Name FROM Win32_Process'; 'wmiobject {0:N0} ms, {1} processes' -f ([DateTime]::Now - $a).TotalMilliseconds, @($all).Count",
    "$s = [DateTime]::Now; $p = [Diagnostics.Process]::GetCurrentProcess().StartTime; 'start-to-script {0:N0} ms' -f ($s - $p).TotalMilliseconds; $a = [DateTime]::Now; Add-Type -AssemblyName System.Management; $all = (New-Object System.Management.ManagementObjectSearcher('SELECT ProcessId, ParentProcessId, CreationDate, Name FROM Win32_Process')).Get(); 'searcher {0:N0} ms, {1} processes' -f ([DateTime]::Now - $a).TotalMilliseconds, $all.Count",
  ];

  @Timeout(600_000)
  @TestMethod
  public async timesTheWindowsListingSourcesAsync(): Promise<void> {
    if (process.platform !== "win32")
      return;

    const lines: string[] = [];
    for (const script of ProcessTreeTests.SCRIPTS) {
      const start = performance.now();
      const output = await new Promise<string>((resolve, reject) => {
        execFile("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], { encoding: "utf8", windowsHide: true },
          (error, standardOutput, standardError) => Object.isNull(error) ? resolve(standardOutput + standardError) : reject(error));
      });
      lines.push(`total ${Math.round(performance.now() - start)} ms; ${output.trim().split(/\r?\n/u).join("; ")}`);
      process.stderr.write(`ARM64-TIMING ${lines.at(-1) ?? String.empty}\n`);
    }

    Assert.fail(`ARM64-TIMING ${lines.join(" | ")}`);
  }
}
