export type DemoSchemaVersion = 'demo-v1';
export type CompiledDemoSchemaVersion = 'compiled-demo-v1';
export type AssetType = 'image' | 'video' | 'audio' | 'font';
export type SceneKind = 'title' | 'screen' | 'comparison' | 'outro';
export type FitMode = 'contain' | 'cover' | 'fill';
export type Easing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
export type Transition = 'none' | 'fade' | 'slide-left' | 'slide-up' | 'scale';
export type EnhancementPurpose = 'background' | 'intro' | 'transition' | 'outro';

export interface Point {
  x: number;
  y: number;
}

export interface Transform {
  x?: number;
  y?: number;
  scale?: number;
  opacity?: number;
}

export interface ProjectMetadata {
  id: string;
  title: string;
  description?: string;
}

export interface CanvasSpec {
  width: number;
  height: number;
  fps: 24 | 25 | 30 | 50 | 60;
  durationFrames: number;
}

export interface BrandSpec {
  background: string;
  foreground: string;
  accent: string;
  fontFamily: string;
  logoAssetId?: string;
}

export interface AssetSpec {
  id: string;
  type: AssetType;
  path: string;
  alt?: string;
  license?: string;
}

export interface CursorSpec {
  from: Point;
  to: Point;
  clickFrames?: number[];
}

export interface CalloutSpec {
  text: string;
  at: Point;
  startFrame: number;
  durationFrames: number;
  accent?: string;
}

export interface SceneSpec {
  id: string;
  kind: SceneKind;
  startFrame: number;
  durationFrames: number;
  assetId?: string;
  secondaryAssetId?: string;
  heading?: string;
  body?: string;
  fit?: FitMode;
  from?: Transform;
  to?: Transform;
  easing?: Easing;
  cursor?: CursorSpec;
  callouts?: CalloutSpec[];
  transitionIn?: Transition;
  transitionOut?: Transition;
}

export interface AudioTrackSpec {
  id: string;
  assetId: string;
  startFrame: number;
  volume: number;
  fadeInFrames?: number;
  fadeOutFrames?: number;
}

export interface OutputSpec {
  id: string;
  width: number;
  height: number;
  fps: 24 | 25 | 30 | 50 | 60;
  fileName: string;
}

export interface EnhancementSpec {
  id: string;
  model: string;
  purpose: EnhancementPurpose;
  prompt: string;
  inputAssetIds?: string[];
}

export interface DemoV1 {
  schemaVersion: DemoSchemaVersion;
  project: ProjectMetadata;
  canvas: CanvasSpec;
  brand: BrandSpec;
  assets: AssetSpec[];
  scenes: SceneSpec[];
  audio?: AudioTrackSpec[];
  outputs: OutputSpec[];
  hiapi?: {
    enabled: boolean;
    enhancements: EnhancementSpec[];
  };
}

export interface CompiledAsset extends AssetSpec {
  sha256: string;
  bytes: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
}

export interface CompiledScene extends SceneSpec {
  endFrame: number;
}

export interface HiapiRequest {
  id: string;
  endpoint: '/v1/tasks';
  model: string;
  purpose: EnhancementPurpose;
  inputAssetIds?: string[];
  body: Record<string, unknown>;
}

export interface CompiledDemoV1 {
  schemaVersion: CompiledDemoSchemaVersion;
  source: {
    schemaVersion: DemoSchemaVersion;
    path: string;
    sha256: string;
  };
  project: ProjectMetadata;
  canvas: CanvasSpec & {durationSeconds: number};
  brand: BrandSpec;
  assets: CompiledAsset[];
  scenes: CompiledScene[];
  audio: AudioTrackSpec[];
  outputs: OutputSpec[];
  hiapiRequests: HiapiRequest[];
}
