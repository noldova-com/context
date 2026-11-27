/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import type { Project } from "@noldova/context";
import { Dictionary, Enumerable, type IReadOnlyList, List } from "@noldova/context.collections";
import { type Diagnostic, DiagnosticCategory } from "@noldova/context.diagnostics";
import { ExceptionOptions } from "@noldova/context.exceptions";
import type { SourceSpan } from "@noldova/context.parsers";

import { SDKException } from "../../exceptions/sdk.exception.js";
import { Resources } from "../../resources.js";
import { PluginResources } from "../plugin-resources.js";
import type { DeclarationResolver } from "../services/declaration-resolver.js";
import { PluginHost } from "../services/plugin-host.js";
import { AddedFile } from "./added-file.js";
import type { Declaration } from "./declaration.js";
import { PluginContext } from "./plugin-context.js";
import type { Plugin } from "./plugin.js";
import { SourceEdit } from "./source-edit.js";
import type { SourceFile } from "./source-file.js";
import type { SourceOrigin } from "./source-origin.js";

export class ProjectPluginContext extends PluginContext {
  public override readonly projectName: string;
  public override readonly sources: IReadOnlyList<SourceFile>;
  public readonly projectDirectory: string;
  public readonly rootDirectory: string;
  public readonly outputDirectory: string;
  public readonly lines: List<string> = new List<string>();
  public readonly addedFiles: List<AddedFile> = new List<AddedFile>();
  private readonly resolver: DeclarationResolver;
  private readonly edits: Dictionary<SourceFile, List<SourceEdit>> = new Dictionary<SourceFile, List<SourceEdit>>();
  private plugin: string = "";
  private failed: boolean = false;

  public constructor(project: Project, rootDirectory: string, outputDirectory: string, sources: IReadOnlyList<SourceFile>, resolver: DeclarationResolver) {
    super();
    this.projectName = project.name;
    this.projectDirectory = project.directory;
    this.rootDirectory = rootDirectory;
    this.outputDirectory = outputDirectory;
    this.sources = sources;
    this.resolver = resolver;
  }

  public get hasErrors(): boolean {
    return this.failed;
  }

  public get isChanged(): boolean {
    return this.edits.any() || this.addedFiles.any();
  }

  public run(plugin: Plugin): void {
    this.plugin = plugin.name;
    try {
      plugin.run(this);
    }
    catch (exception) {
      if (exception instanceof SDKException)
        throw exception;

      throw new SDKException(PluginResources.formatPluginFailed(plugin.name, exception), new ExceptionOptions(exception));
    }
  }

  public override resolve(source: SourceFile, name: string): Declaration | undefined {
    return this.resolver.resolve(source, name);
  }

  public override replace(source: SourceFile, span: SourceSpan, text: string): void {
    if (!this.sources.contains(source))
      throw new SDKException(PluginResources.formatSourceNotInProject(this.plugin, source.path));

    const edits = this.edits.tryGet(source) ?? new List<SourceEdit>();
    edits.add(new SourceEdit(span, text, this.plugin));
    this.edits.set(source, edits);
  }

  public override addFile(path: string, text: string, origin: SourceOrigin): void {
    if (path.includes(Resources.backslash) || path.startsWith(Resources.pathSeparator) || Enumerable.from(path.split(Resources.pathSeparator)).any(t => Resources.relativeSegments.contains(t))
      || !path.endsWith(PluginResources.sourceExtension) || path.endsWith(PluginResources.declarationExtension))
      throw new SDKException(PluginResources.formatAddedFilePathInvalid(this.plugin, path));
    if (this.sources.any(t => PluginHost.relativePath(this.rootDirectory, t.path) === path) || this.addedFiles.any(t => t.path === path))
      throw new SDKException(PluginResources.formatAddedFileRepeated(this.plugin, path));

    this.addedFiles.add(new AddedFile(path, text, origin));
  }

  public override report(diagnostic: Diagnostic): void {
    const location = diagnostic.location;
    const source = this.sources.firstOrDefault(t => t.path === location?.sourceIdentity);
    if (Object.isUndefined(location) || Object.isUndefined(source))
      throw new SDKException(PluginResources.formatDiagnosticNotInProject(this.plugin, diagnostic.message.text));

    const position = source.lines.getPosition(location.start);
    this.lines.add(PluginResources.formatDiagnostic(PluginHost.relativePath(this.projectDirectory, source.path), position.lineIndex + 1,
      position.characterIndex + 1, diagnostic.category.toLowerCase(), diagnostic.code.displayText, diagnostic.message.text));
    if (diagnostic.category === DiagnosticCategory.Error)
      this.failed = true;
  }

  public editsOf(source: SourceFile): IReadOnlyList<SourceEdit> {
    const edits = (this.edits.tryGet(source) ?? new List<SourceEdit>()).orderBy(t => t.span.startOffset).toList();
    edits.aggregate<SourceEdit | undefined>(undefined, (previous, t) => {
      if (!Object.isUndefined(previous) && t.span.startOffset < Math.max(previous.span.endOffset, previous.span.startOffset + 1))
        throw new SDKException(PluginResources.formatEditsOverlap(source.path, previous.plugin, t.plugin));

      return t;
    });

    return edits;
  }
}
