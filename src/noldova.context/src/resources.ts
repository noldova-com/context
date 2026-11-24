/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Resources {
  public static readonly defaultSdk: string = "noldova.context.sdk";
  public static readonly identityPattern: RegExp = /^noldova\.context(?:\.[a-z0-9]+)+$/u;
  public static readonly identityPrefix: string = "noldova.";
  public static readonly packageScope: string = "@noldova/";
  public static readonly manifestExtension: string = ".ctxp";
  public static readonly sourceExtension: string = ".ts";
  public static readonly defaultEntrySource: string = "main.ts";
  public static readonly projectOption: string = "--project";
  public static readonly argumentsSeparator: string = "--";
  public static readonly helpOptions: readonly string[] = ["-h", "--help"];
  public static readonly nameField: string = "name";
  public static readonly kindField: string = "kind";
  public static readonly sdkField: string = "sdk";
  public static readonly toolsField: string = "tools";
  public static readonly entryField: string = "entry";
  public static readonly sourceField: string = "source";
  public static readonly classField: string = "class";
  public static readonly listSeparator: string = ", ";
  public static readonly lineSeparator: string = "\n";
  public static readonly textEncoding: BufferEncoding = "utf8";
  public static readonly commandColumnWidth: number = 12;
  public static readonly usage: string = "Usage: ctx <command> [--project <file>] [arguments]";
  public static readonly commandsHeading: string = "Commands:";
  public static readonly noProjectNote: string = "No project file (.ctxp) is in this folder; the commands come from the SDK and tools a project names.";
  public static readonly projectOptionValueMissing: string = "--project needs the project file (.ctxp) to use.";

  public static formatPackageName(identity: string): string {
    return `${Resources.packageScope}${identity.substring(Resources.identityPrefix.length)}`;
  }

  public static formatCommandLine(name: string, description: string): string {
    return `  ${name.padEnd(Resources.commandColumnWidth)}${description}`;
  }

  public static formatProjectNotFound(directory: string): string {
    return `No project file (.ctxp) is in "${directory}"; name one with --project <file>.`;
  }

  public static formatProjectAmbiguous(directory: string, fileNames: readonly string[]): string {
    return `"${directory}" holds ${fileNames.length} project files (${fileNames.join(Resources.listSeparator)}); name one with --project <file>.`;
  }

  public static formatProjectUnreadable(manifestPath: string): string {
    return `The project file "${manifestPath}" can't be read.`;
  }

  public static formatProjectInvalid(manifestPath: string, reason: string): string {
    return `The project file "${manifestPath}" is invalid: ${reason}`;
  }

  public static formatKindInvalid(kind: string): string {
    return `"kind" is "${kind}", not "library" or "executable".`;
  }

  public static formatIdentityInvalid(field: string, identity: string): string {
    return `"${field}" names "${identity}", which is not a package identity such as noldova.context.sdk.`;
  }

  public static formatToolRepeated(identity: string): string {
    return `"tools" names "${identity}" more than once, or names the SDK.`;
  }

  public static formatEntrySourceInvalid(source: string): string {
    return `"entry.source" is "${source}", not a TypeScript source such as main.ts.`;
  }

  public static formatProviderMissing(identity: string, manifestPath: string): string {
    return `The project "${manifestPath}" names "${identity}", but ${Resources.formatPackageName(identity)} is not installed for it.`;
  }

  public static formatProviderUnloadable(identity: string): string {
    return `"${identity}" could not be loaded.`;
  }

  public static formatProviderEmpty(identity: string): string {
    return `"${identity}" offers no commands: it exports no class that extends Command.`;
  }

  public static formatCommandCollision(name: string, first: string, second: string): string {
    return `The command "${name}" is offered by both "${first}" and "${second}".`;
  }

  public static formatCommandUnknown(name: string): string {
    return `"${name}" is not a command of this project; ctx --help lists them.`;
  }
}
