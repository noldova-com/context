/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Dictionary, type IReadOnlyDictionary, type IReadOnlyList, KeyValuePair } from "@noldova/context.collections";

import { ProcessListing } from "./models/process-listing.js";
import { ProcessSignals } from "./models/process-signals.js";

export class Resources {
  public static readonly endLine: string = "end";
  public static readonly refusedPrefix: string = "refused ";
  public static readonly lineSeparator: string = "\n";
  public static readonly entryPattern: RegExp = /^(?<processId>\d+)\s+(?<parentId>\d+)\s+(?<groupId>\d+)\s+(?<state>\S+)\s+(?<startTime>\d+)$/u;
  public static readonly processIdGroup: string = "processId";
  public static readonly parentIdGroup: string = "parentId";
  public static readonly groupIdGroup: string = "groupId";
  public static readonly stateGroup: string = "state";
  public static readonly startTimeGroup: string = "startTime";
  public static readonly zombieState: string = "Z";
  public static readonly listSeparator: string = ", ";
  public static readonly textEncoding: BufferEncoding = "utf8";
  public static readonly closeEvent: string = "close";
  public static readonly errorEvent: string = "error";
  public static readonly lineEvent: string = "line";
  public static readonly listerFolderPrefix: string = "noldova-process-lister-";
  public static readonly removalRetries: number = 5;
  public static readonly roundMilliseconds: number = 50;
  public static readonly defaultGraceMilliseconds: number = 0;
  public static readonly defaultLimitMilliseconds: number = 10_000;
  public static readonly readLimitMilliseconds: number = 10_000;
  public static readonly listerMarginMilliseconds: number = 5_000;
  public static readonly listerReadyMilliseconds: number = 45_000;
  public static readonly listingTries: number = 3;
  public static readonly processIdParameterName: string = "processId";
  public static readonly startTimeParameterName: string = "startTime";
  public static readonly graceMillisecondsParameterName: string = "graceMilliseconds";
  public static readonly limitMillisecondsParameterName: string = "limitMilliseconds";
  public static readonly listingEnvironment: Readonly<Record<string, string>> = { LC_ALL: "C", TZ: "UTC0" };
  public static readonly posixListingScript: string = [
    `echo ${Resources.endLine}`,
    "while read -r line; do",
    "  ps -A -o pid=,ppid=,pgid=,stat=,lstart= | awk 'BEGIN { months = \"JanFebMarAprMayJunJulAugSepOctNovDec\" } " +
    "{ month = (index(months, $6) + 2) / 3; year = $9; if (month <= 2) { year -= 1; month += 12 } split($8, time, \":\"); " +
    "days = 365 * year + int(year / 4) - int(year / 100) + int(year / 400) + int((153 * (month - 3) + 2) / 5) + $7 - 719469; " +
    "printf \"%s %s %s %s %.0f\\n\", $1, $2, $3, $4, (((days * 24 + time[1]) * 60 + time[2]) * 60 + time[3]) * 1000 }'",
    `  echo ${Resources.endLine}`,
    "done",
    ""
  ].join(Resources.lineSeparator);
  public static readonly windowsListingScript: string = [
    "$ErrorActionPreference = 'Stop'",
    "try {",
    "  $module = [AppDomain]::CurrentDomain.DefineDynamicAssembly((New-Object Reflection.AssemblyName 'NoldovaProcessListing'), 'Run').DefineDynamicModule('NoldovaProcessListing')",
    "  $type = $module.DefineType('NoldovaProcessListing', 'Public, Abstract, Sealed')",
    "  $method = $type.DefinePInvokeMethod('NtQuerySystemInformation', 'ntdll.dll', 'Public, Static, PinvokeImpl', 'Standard', [int],",
    "    [Type[]] @([int], [IntPtr], [int], [int].MakeByRefType()), 'Winapi', 'Unicode')",
    "  $method.SetImplementationFlags('PreserveSig')",
    "  $native = $type.CreateType()",
    "}",
    `catch { Write-Output ('${Resources.refusedPrefix}' + ($_.Exception.Message -replace '\\s+', ' ')); exit 1 }`,
    "$length = 1048576",
    "function Get-Listing {",
    "  for (;;) {",
    "    $buffer = [Runtime.InteropServices.Marshal]::AllocHGlobal($script:length)",
    "    try {",
    "      $needed = 0",
    "      $status = $native::NtQuerySystemInformation(5, $buffer, $script:length, [ref] $needed)",
    "      if ($status -eq -1073741820) { $script:length = [Math]::Max($needed, $script:length * 2); continue }",
    "      if ($status -ne 0) { throw \"NtQuerySystemInformation returned $status\" }",
    "      $bytes = New-Object byte[] $script:length",
    "      [Runtime.InteropServices.Marshal]::Copy($buffer, $bytes, 0, $script:length)",
    "    }",
    "    finally { [Runtime.InteropServices.Marshal]::FreeHGlobal($buffer) }",
    "    $lines = New-Object Text.StringBuilder",
    "    $remainder = [long] 0",
    "    for ($offset = 0; ; $offset += $next) {",
    "      $created = [BitConverter]::ToInt64($bytes, $offset + 32)",
    "      if ([IntPtr]::Size -eq 8) { $id = [BitConverter]::ToInt64($bytes, $offset + 80); $parent = [BitConverter]::ToInt64($bytes, $offset + 88) }",
    "      else { $id = [BitConverter]::ToInt32($bytes, $offset + 68); $parent = [BitConverter]::ToInt32($bytes, $offset + 72) }",
    "      $start = if ($created -eq 0) { 0 } else { [Math]::DivRem($created - 116444736000000000, [long] 10000, [ref] $remainder) }",
    "      $null = $lines.Append($id).Append(' ').Append($parent).Append(' 0 R ').Append($start).Append(\"`n\")",
    "      $next = [BitConverter]::ToInt32($bytes, $offset)",
    "      if ($next -eq 0) { return $lines.ToString() }",
    "    }",
    "  }",
    "}",
    `[Console]::Out.WriteLine('${Resources.endLine}')`,
    `while ($null -ne [Console]::In.ReadLine()) { [Console]::Out.Write((Get-Listing)); [Console]::Out.WriteLine('${Resources.endLine}') }`,
    ""
  ].join(Resources.lineSeparator);
  public static readonly listings: IReadOnlyDictionary<string, ProcessListing> = new Dictionary([
    new KeyValuePair("linux", new ProcessListing("sh", [], "list-processes.sh", Resources.posixListingScript, new ProcessSignals("SIGSTOP", "SIGCONT", "SIGTERM", "SIGKILL"), 10, Resources.listerReadyMilliseconds)),
    new KeyValuePair("darwin", new ProcessListing("sh", [], "list-processes.sh", Resources.posixListingScript, new ProcessSignals("SIGSTOP", "SIGCONT", "SIGTERM", "SIGKILL"), 10, Resources.listerReadyMilliseconds)),
    new KeyValuePair("win32", new ProcessListing("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File"], "list-processes.ps1", Resources.windowsListingScript, new ProcessSignals(0, 0, 0, "SIGKILL"), 1, Resources.listerReadyMilliseconds))
  ]);

  public static formatPlatformUnsupported(platform: string): string {
    return `Processes can't be listed on "${platform}"; Linux, macOS and Windows are supported.`;
  }

  public static formatListerEnded(file: string): string {
    return `The process lister "${file}" ended before it answered.`;
  }

  public static formatListerNotReady(file: string, limitMilliseconds: number, waitedMilliseconds: number): string {
    return `The process lister "${file}" was not ready within its ${limitMilliseconds} ms limit; it was waited for ${waitedMilliseconds} ms.`;
  }

  public static formatListerRefused(file: string, reason: string): string {
    return `The process lister "${file}" could not set up its listing, as the machine refused it: ${reason}`;
  }

  public static formatListingIncomplete(file: string, tries: number): string {
    return `The process lister "${file}" left the process that called it out of every listing, so each was incomplete; listings made: ${tries}.`;
  }

  public static formatEntryInvalid(line: string): string {
    return `The process lister answered "${line}", which is not a process id, parent id, group id, state and start time.`;
  }

  public static formatTreeNotEnded(survivors: IReadOnlyList<string>, limitMilliseconds: number): string {
    return `The process tree still had ${survivors.count()} processes when its ${limitMilliseconds} ms limit passed: ${survivors.toArray().join(Resources.listSeparator)}.`;
  }

  public static formatSurvivor(processId: number, startTime: number): string {
    return `${processId} started at ${new Date(startTime).toISOString()}`;
  }
}
