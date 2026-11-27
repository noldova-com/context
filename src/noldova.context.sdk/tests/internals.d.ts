/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare module "@noldova/context.sdk/models/build-project.js" {
  import type { IReadOnlyList } from "@noldova/context.collections";
  import type { Project } from "@noldova/context";

  export class BuildProject {
    public readonly project: Project;
    public readonly packages: IReadOnlyList<string>;
  }
}

declare module "@noldova/context.sdk/services/project-graph.reader.js" {
  import type { IReadOnlyList } from "@noldova/context.collections";
  import type { BuildProject } from "@noldova/context.sdk/models/build-project.js";

  export class ProjectGraphReader {
    public static readAsync(manifestPath: string): Promise<IReadOnlyList<BuildProject>>;
  }
}

declare module "@noldova/context.sdk/plugins/models/source-file.js" {
  import type { Source, SourceLineMap } from "@noldova/context.parsers";
  import type { TypeScriptNode, TypeScriptSourceKind } from "@noldova/context.parsers.typescript";

  export class SourceFile {
    public readonly path: string;
    public readonly source: Source;
    public readonly lines: SourceLineMap;
    public readonly rootNode: TypeScriptNode;

    public static parse(path: string, text: string, sourceKind: TypeScriptSourceKind): SourceFile;
  }
}

declare module "@noldova/context.sdk/plugins/models/source-origin.js" {
  import type { SourceSpan } from "@noldova/context.parsers";
  import type { SourceFile } from "@noldova/context.sdk/plugins/models/source-file.js";

  export class SourceOrigin {
    public readonly source: SourceFile;
    public readonly span: SourceSpan;

    public constructor(source: SourceFile, span: SourceSpan);
  }
}

declare module "@noldova/context.sdk/plugins/models/declaration.js" {
  import type { Node } from "@noldova/context.parsers";
  import type { SourceFile } from "@noldova/context.sdk/plugins/models/source-file.js";

  export class Declaration {
    public readonly name: string;
    public readonly source: SourceFile;
    public readonly node: Node;
  }
}

declare module "@noldova/context.sdk/plugins/models/plugin-context.js" {
  import type { IReadOnlyList } from "@noldova/context.collections";
  import type { Diagnostic } from "@noldova/context.diagnostics";
  import type { SourceSpan } from "@noldova/context.parsers";
  import type { Declaration } from "@noldova/context.sdk/plugins/models/declaration.js";
  import type { SourceFile } from "@noldova/context.sdk/plugins/models/source-file.js";
  import type { SourceOrigin } from "@noldova/context.sdk/plugins/models/source-origin.js";

  export abstract class PluginContext {
    public abstract readonly projectName: string;
    public abstract readonly sources: IReadOnlyList<SourceFile>;

    public abstract resolve(source: SourceFile, name: string): Declaration | undefined;
    public abstract replace(source: SourceFile, span: SourceSpan, text: string): void;
    public abstract addFile(path: string, text: string, origin: SourceOrigin): void;
    public abstract report(diagnostic: Diagnostic): void;
  }
}

declare module "@noldova/context.sdk/plugins/models/plugin.js" {
  import type { PluginContext } from "@noldova/context.sdk/plugins/models/plugin-context.js";

  export abstract class Plugin {
    public abstract readonly name: string;
    public abstract readonly packageName: string;

    public abstract run(context: PluginContext): void;
  }
}

declare module "@noldova/context.sdk/plugins/models/source-mapping.js" {
  export class SourceMapping {
    public readonly column: number;
    public readonly sourceIndex: number;
    public readonly line: number;
    public readonly character: number;
    public readonly nameIndex: number;
    public readonly fieldCount: number;

    public constructor(column: number, sourceIndex: number, line: number, character: number, nameIndex: number, fieldCount: number);
  }
}

declare module "@noldova/context.sdk/plugins/models/position-map.js" {
  export class PositionMap {
    public readonly path: string;
    public readonly text: string;
  }
}

declare module "@noldova/context.sdk/plugins/models/source-edit.js" {
  import type { SourceSpan } from "@noldova/context.parsers";

  export class SourceEdit {
    public constructor(span: SourceSpan, text: string, plugin: string);
  }
}

declare module "@noldova/context.sdk/plugins/models/mapped-output.js" {
  import type { IReadOnlyDictionary } from "@noldova/context.collections";
  import { CommandOutput } from "@noldova/context";
  import type { PositionMap } from "@noldova/context.sdk/plugins/models/position-map.js";

  export class MappedOutput extends CommandOutput {
    public constructor(output: CommandOutput, directory: string, maps: IReadOnlyDictionary<string, PositionMap>);

    public override writeLine(text: string): void;
    public override writeErrorLine(text: string): void;
  }
}

declare module "@noldova/context.sdk/plugins/services/source-rewriter.js" {
  import type { IReadOnlyList } from "@noldova/context.collections";
  import type { PositionMap } from "@noldova/context.sdk/plugins/models/position-map.js";
  import type { SourceEdit } from "@noldova/context.sdk/plugins/models/source-edit.js";
  import type { SourceFile } from "@noldova/context.sdk/plugins/models/source-file.js";

  export class SourceRewriter {
    public static rewrite(path: string, source: SourceFile, edits: IReadOnlyList<SourceEdit>): PositionMap;
  }
}

declare module "@noldova/context.sdk/plugins/services/base64-vlq.js" {
  import type { IReadOnlyList } from "@noldova/context.collections";
  import type { SourceMapping } from "@noldova/context.sdk/plugins/models/source-mapping.js";

  export class Base64Vlq {
    public static decode(mappings: string): IReadOnlyList<IReadOnlyList<SourceMapping>>;
    public static encode(lines: IReadOnlyList<IReadOnlyList<SourceMapping>>): string;
  }
}

declare module "@noldova/context.sdk/plugins/services/source-map-composer.js" {
  import type { IReadOnlyDictionary } from "@noldova/context.collections";
  import type { PositionMap } from "@noldova/context.sdk/plugins/models/position-map.js";

  export class SourceMapComposer {
    public static composeAsync(outputDirectory: string, maps: IReadOnlyDictionary<string, PositionMap>): Promise<void>;
  }
}

declare module "@noldova/context.sdk/plugins/services/plugin-builder.js" {
  import type { IReadOnlyList } from "@noldova/context.collections";
  import type { CommandOutput } from "@noldova/context";
  import type { BuildProject } from "@noldova/context.sdk/models/build-project.js";
  import type { Plugin } from "@noldova/context.sdk/plugins/models/plugin.js";

  export class PluginBuilder {
    public static buildAsync(build: BuildProject, plugins: IReadOnlyList<Plugin>, arguments_: readonly string[], output: CommandOutput): Promise<boolean>;
  }
}

declare module "@noldova/context.sdk/plugins/plugin-catalog.js" {
  import type { IReadOnlyList } from "@noldova/context.collections";
  import type { Plugin } from "@noldova/context.sdk/plugins/models/plugin.js";

  export class PluginCatalog {
    public static readonly all: IReadOnlyList<Plugin>;
  }
}
