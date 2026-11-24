/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ExceptionOptions } from "@noldova/context.exceptions";
import { JsonException, JsonReader } from "@noldova/context.json";

import { ProjectKind } from "../enums/project-kind.js";
import { ProjectFileException } from "../exceptions/project-file.exception.js";
import { Resources } from "../resources.js";
import { ProjectEntryPoint } from "./project-entry-point.js";

export class Project {
  public readonly name: string;
  public readonly kind: ProjectKind;
  public readonly sdk: string;
  public readonly tools: readonly string[];
  public readonly entryPoint: ProjectEntryPoint | undefined;
  public readonly manifestPath: string;
  public readonly directory: string;

  private constructor(name: string, kind: ProjectKind, sdk: string, tools: readonly string[], entryPoint: ProjectEntryPoint | undefined, manifestPath: string, directory: string) {
    this.name = name;
    this.kind = kind;
    this.sdk = sdk;
    this.tools = tools;
    this.entryPoint = entryPoint;
    this.manifestPath = manifestPath;
    this.directory = directory;
  }

  public get providers(): readonly string[] {
    return [this.sdk, ...this.tools];
  }

  public static parse(text: string, manifestPath: string, directory: string): Project {
    try {
      const reader = JsonReader.parse(text);
      const kind = Project.readKind(reader, manifestPath);
      const sdk = Project.readIdentity(reader.readOptionalString(Resources.sdkField) ?? Resources.defaultSdk, Resources.sdkField, manifestPath);
      const tools = Project.readTools(reader, sdk, manifestPath);

      return new Project(reader.readNonBlankString(Resources.nameField), kind, sdk, tools, Project.readEntryPoint(reader, kind, manifestPath), manifestPath, directory);
    }
    catch (exception) {
      if (exception instanceof JsonException)
        throw new ProjectFileException(manifestPath, Resources.formatProjectInvalid(manifestPath, exception.message), new ExceptionOptions(exception));

      throw exception;
    }
  }

  private static readKind(reader: JsonReader, manifestPath: string): ProjectKind {
    const kind = reader.readString(Resources.kindField);
    if (kind === ProjectKind.Library)
      return ProjectKind.Library;
    if (kind === ProjectKind.Executable)
      return ProjectKind.Executable;

    throw new ProjectFileException(manifestPath, Resources.formatProjectInvalid(manifestPath, Resources.formatKindInvalid(kind)));
  }

  private static readIdentity(identity: string, field: string, manifestPath: string): string {
    if (!Resources.identityPattern.test(identity))
      throw new ProjectFileException(manifestPath, Resources.formatProjectInvalid(manifestPath, Resources.formatIdentityInvalid(field, identity)));

    return identity;
  }

  private static readTools(reader: JsonReader, sdk: string, manifestPath: string): readonly string[] {
    if (!reader.hasField(Resources.toolsField))
      return [];

    const seen = new Set<string>([sdk]);
    const tools = reader.readStringArray(Resources.toolsField);
    for (const tool of tools) {
      Project.readIdentity(tool, Resources.toolsField, manifestPath);
      if (seen.has(tool))
        throw new ProjectFileException(manifestPath, Resources.formatProjectInvalid(manifestPath, Resources.formatToolRepeated(tool)));

      seen.add(tool);
    }

    return tools;
  }

  private static readEntryPoint(reader: JsonReader, kind: ProjectKind, manifestPath: string): ProjectEntryPoint | undefined {
    if (kind !== ProjectKind.Executable)
      return undefined;
    if (!reader.hasField(Resources.entryField))
      return new ProjectEntryPoint();

    const entry = reader.readObject(Resources.entryField);
    const source = entry.readOptionalString(Resources.sourceField) ?? Resources.defaultEntrySource;
    if (!source.endsWith(Resources.sourceExtension) || source.length === Resources.sourceExtension.length)
      throw new ProjectFileException(manifestPath, Resources.formatProjectInvalid(manifestPath, Resources.formatEntrySourceInvalid(source)));

    return new ProjectEntryPoint(source, entry.readOptionalString(Resources.classField));
  }
}
