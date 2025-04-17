declare module 'gaussian-splats-3d' {
  export enum SplatRenderMode {
    TwoD = 0,
    ThreeD = 1
  }

  export class Viewer {
    constructor(options?: ViewerOptions);
    addSplatBuffers(splatBuffers: SplatBuffer[], options?: SplatBufferOptions[]): Promise<void>;
    start(): void;
    dispose(): void;
    // 添加其他你需要的方法
  }

  export interface ViewerOptions {
    cameraUp?: number[];
    initialCameraPosition?: number[];
    initialCameraLookAt?: number[];
    halfPrecisionCovariancesOnGPU?: boolean;
    antialiased?: boolean;
    splatRenderMode?: SplatRenderMode;
    sphericalHarmonicsDegree?: number;
    container?: HTMLElement;
  }

  export interface SplatBufferOptions {
    splatAlphaRemovalThreshold?: number;
  }

  export interface SplatBuffer {
    // 根据实际需要定义
  }

  export class LoaderUtils {
    static sceneFormatFromPath(path: string): string;
    static fileBufferToSplatBuffer(
      fileData: { data: ArrayBuffer },
      format: string,
      alphaRemovalThreshold: number,
      blockSize?: number,
      compressionLevel?: number,
      progressCallback?: (progress: number) => void,
      errorCallback?: (error: Error) => void,
      sphericalHarmonicsDegree?: number
    ): Promise<SplatBuffer>;
  }
}
  