/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Resources {
  public static readonly addSubcommand: string = "add";
  public static readonly commandDescription: string = "Adds the next migration of a data context from its model.";
  public static readonly commandName: string = "migrations";
  public static readonly compiledExtension: string = ".js";
  public static readonly compilerOptionsField: string = "compilerOptions";
  public static readonly configurationFileName: string = "tsconfig.json";
  public static readonly contextBaseName: string = "DbContext";
  public static readonly contextMissing: string = "No class in the project's sources extends DbContext.";
  public static readonly contextOption: string = "--context";
  public static readonly declarationExtension: string = ".d.ts";
  public static readonly extendsField: string = "extends";
  public static readonly helpOptions: readonly string[] = ["-h", "--help"];
  public static readonly listFileSuffix: string = "-migrations.ts";
  public static readonly listSuffix: string = "Migrations";
  public static readonly migrationBaseName: string = "SqlMigration";
  public static readonly migrationFilePattern: RegExp = /^\d{14}-.+\.ts$/;
  public static readonly migrationNamePattern: RegExp = /^[A-Z][A-Za-z0-9]*$/;
  public static readonly migrationsFolderName: string = "migrations";
  public static readonly noChange: string = "The model matches the last migration's snapshot: no migration was added.";
  public static readonly optionPrefix: string = "--";
  public static readonly outputDirectoryField: string = "outDir";
  public static readonly outputOption: string = "--output";
  public static readonly packageScope: string = "@noldova/";
  public static readonly packagesFolderName: string = "node_modules";
  public static readonly providerMissing: string = "Name the SQL provider with --provider, such as --provider noldova.context.data.sql.sqlite.";
  public static readonly providerOption: string = "--provider";
  public static readonly providerPattern: RegExp = /^noldova\.context(?:\.[a-z0-9]+)+$/u;
  public static readonly rootDirectoryField: string = "rootDir";
  public static readonly snapshotFileSuffix: string = "-model-snapshot.ts";
  public static readonly snapshotSuffix: string = "ModelSnapshot";
  public static readonly sourceExtension: string = ".ts";
  public static readonly stampLength: number = 14;
  public static readonly textEncoding: BufferEncoding = "utf8";
  public static readonly usage: readonly string[] = [
    "Usage: ctx migrations add <Name> --provider <identity> [--context <Class>] [--output <folder>]",
    "",
    "Adds the next migration of the project's data context, with its model snapshot and its list of migrations.",
    "Build the project first.",
    "",
    "  <Name>                 The migration's name, PascalCase, such as AddNotes.",
    "  --provider <identity>  The SQL provider, such as noldova.context.data.sql.sqlite.",
    "  --context <Class>      The data context, when the project has more than one.",
    "  --output <folder>      Where the files go, relative to the project's folder; by default",
    "                         migrations/<provider> beside the context's source.",
    "  -h, --help             Shows this help."
  ];

  public static readonly options: readonly string[] = [Resources.contextOption, Resources.outputOption, Resources.providerOption];
  public static formatCompiledMissing(source: string, compiled: string): string {
    return `The compiled "${compiled}" of "${source}" is missing: build the project first.`;
  }

  public static formatCompiledUnloadable(compiled: string, error: unknown): string {
    return `The compiled "${compiled}" can't be loaded: ${String(error)}`;
  }

  public static formatConfigurationFolderMissing(configuration: string, field: string): string {
    return `"${configuration}" sets no "${Resources.compilerOptionsField}.${field}", which the tool needs to find the sources and their compiled files.`;
  }

  public static formatConfigurationInvalid(configuration: string, message: string): string {
    return `"${configuration}" isn't JSON the tool can read: ${message}`;
  }

  public static formatConfigurationMissing(configuration: string): string {
    return `The TypeScript configuration "${configuration}" can't be read; the tool reads the "${Resources.configurationFileName}" beside the project file.`;
  }

  public static formatContextAmbiguous(contexts: readonly string[]): string {
    return `More than one class extends DbContext: ${contexts.join(", ")}; name one with ${Resources.contextOption}.`;
  }

  public static formatContextNotFound(name: string): string {
    return `No class named "${name}" in the project's sources extends DbContext.`;
  }

  public static formatDialectMissing(provider: string): string {
    return `The provider "${provider}" exports no SqlDialect.`;
  }

  public static formatEntitySourceAmbiguous(entity: string, files: readonly string[]): string {
    return `The context maps "${entity}", and more than one source class has that name: ${files.join(", ")}.`;
  }

  public static formatEntitySourceMissing(entity: string): string {
    return `The context maps "${entity}", but no class of that name is in the project's sources.`;
  }

  public static formatExportMissing(file: string, name: string): string {
    return `The compiled "${file}" exports no class "${name}" of the kind its source declares: build the project again.`;
  }

  public static formatMigrationClassMissing(file: string): string {
    return `The migration "${file}" has no one class that extends ${Resources.migrationBaseName}.`;
  }

  public static formatMigrationNameCount(count: number): string {
    return `Name the migration once, such as AddNotes; ${count} names were given.`;
  }

  public static formatMigrationNameInvalid(name: string): string {
    return `The migration name "${name}" isn't PascalCase: begin with a capital letter and use only letters and digits, such as AddNotes.`;
  }

  public static formatMigrationNameTaken(name: string, file: string): string {
    return `The migration "${file}" is already named "${name}".`;
  }

  public static formatModelInvalid(context: string, error: unknown): string {
    return `The model of "${context}" can't be built: ${String(error)}`;
  }

  public static formatOptionRepeated(option: string): string {
    return `The option "${option}" is given more than once.`;
  }

  public static formatOptionUnknown(option: string): string {
    return `The option "${option}" is unknown; ctx migrations --help lists the options.`;
  }

  public static formatOptionValueMissing(option: string): string {
    return `The option "${option}" needs a value.`;
  }

  public static formatPackageMissing(packageName: string, project: string): string {
    return `The provider package ${packageName} is not installed for "${project}".`;
  }

  public static formatPackageName(identity: string): string {
    return `${Resources.packageScope}${identity.substring(identity.indexOf(".") + 1)}`;
  }

  public static formatPropertyTypeUnmapped(entity: string, property: string): string {
    return `The property "${entity}.${property}" has a type the tool can't map: write string or number, a mapped entity class with "| null", or an array of one; `
      + `add "| null" to a string or number that may be absent.`;
  }

  public static formatProviderInvalid(provider: string): string {
    return `"${provider}" isn't a provider identity, such as noldova.context.data.sql.sqlite.`;
  }

  public static formatSourceInvalid(file: string, message: string): string {
    return `The source "${file}" doesn't parse: ${message}`;
  }

  public static formatSubcommandUnknown(subcommand: string): string {
    return `"ctx migrations ${subcommand}" is unknown; ctx migrations --help shows its use.`;
  }

  public static formatWritten(path: string): string {
    return `Wrote "${path}".`;
  }
}
