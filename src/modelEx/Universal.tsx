import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import * as THREE from "three";
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";

export default function ViewerDisplay() {
  const [searchParams] = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<GaussianSplats3D.Viewer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const objectURLRef = useRef<string>(""); // 修复1: 使用ref存储objectURL

  useEffect(() => {
    const abortController = new AbortController(); // 修复2: 添加中止控制器
    let isMounted = true;

    const loadScene = async () => {
      try {
        if (!containerRef.current || !isMounted) return;

        setLoading(true);
        setError("");

        // 1. 解析参数
        const fileName = searchParams.get("file") || "model.splat";
        const base64Data = searchParams.get("data") || "";
        const alphaThreshold = parseInt(searchParams.get("alpha") || "1");
        const cameraUp = (searchParams.get("cu") || "0,1,0").split(",").map(Number);
        const cameraPosition = (searchParams.get("cp") || "0,1,0").split(",").map(Number);
        const cameraLookAt = (searchParams.get("cla") || "1,0,0").split(",").map(Number);
        const antialiased = searchParams.get("aa") === "true";
        const scene2D = searchParams.get("2d") === "true";
        const shDegree = parseInt(searchParams.get("sh") || "0");

        // 2. 转换Base64为File对象
        const arrayBuffer = base64ToArrayBuffer(base64Data);
        const file = new File([arrayBuffer], fileName, {
          type: getMimeType(fileName),
        });

        // 3. 创建对象URL
        objectURLRef.current = URL.createObjectURL(file); // 修复3: 使用ref存储

        // 4. 初始化Viewer
        const viewer = new GaussianSplats3D.Viewer({
          cameraUp,
          initialCameraPosition: cameraPosition,
          initialCameraLookAt: cameraLookAt,
          antialiased,
          splatRenderMode: scene2D
            ? GaussianSplats3D.SplatRenderMode.TwoD
            : GaussianSplats3D.SplatRenderMode.ThreeD,
          sphericalHarmonicsDegree: shDegree,
          container: containerRef.current,
          background: new THREE.Color(0x000000), // 修复4: 初始化时设置背景
        });

        viewerRef.current = viewer;

        // 5. 获取格式并加载
        const format = GaussianSplats3D.LoaderUtils.sceneFormatFromPath(file.name);
        
        await viewer.addSplatScene(objectURLRef.current, {
          format,
          splatAlphaRemovalThreshold: alphaThreshold,
          halfPrecisionCovariancesOnGPU: false,
          progressiveLoad: false,
          signal: abortController.signal, // 修复5: 传递中止信号
        });

        viewer.start();
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("加载失败:", err);
          setError(err instanceof Error ? err.message : "无法加载模型");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadScene();

    return () => {
      isMounted = false;
      abortController.abort(); // 修复6: 中止未完成请求
      if (objectURLRef.current) {
        URL.revokeObjectURL(objectURLRef.current);
      }
      viewerRef.current?.dispose();
    };
  }, [searchParams]);

  // Base64转ArrayBuffer
  const base64ToArrayBuffer = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // 获取MIME类型
  const getMimeType = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "ply": return "application/octet-stream";
      case "splat": return "application/octet-stream";
      case "ksplat": return "application/octet-stream";
      default: return "application/octet-stream";
    }
  };

  return (
    <div>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}