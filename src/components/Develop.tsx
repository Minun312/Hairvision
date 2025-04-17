import { useEffect } from "react";
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import * as THREE from "three";
import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useState } from "react";

export default function Develop() {
  const convertButtonRef = React.useRef(null);
  const [fileName, setFileName] = useState("(未选择文件)");
  useEffect(() => {
    onCompressionLevelChange();
  }, []);

  const fileBufferToSplatBuffer = (
    fileBufferData,
    format,
    alphaRemovalThreshold,
    compressionLevel,
    sectionSize,
    sceneCenter,
    blockSize,
    bucketSize,
    outSphericalHarmonicsDegree = 0
  ) => {
    if (format === GaussianSplats3D.SceneFormat.Ply) {
      return GaussianSplats3D.PlyLoader.loadFromFileData(
        fileBufferData.data,
        alphaRemovalThreshold,
        compressionLevel,
        true,
        outSphericalHarmonicsDegree,
        sectionSize,
        sceneCenter,
        blockSize,
        bucketSize
      );
    } else {
      if (format === GaussianSplats3D.SceneFormat.Splat) {
        return GaussianSplats3D.SplatLoader.loadFromFileData(
          fileBufferData.data,
          alphaRemovalThreshold,
          compressionLevel,
          true,
          sectionSize,
          sceneCenter,
          blockSize,
          bucketSize
        );
      } else {
        return GaussianSplats3D.KSplatLoader.loadFromFileData(
          fileBufferData.data
        );
      }
    }
  };

  const onCompressionLevelChange = (e) => {
    let compressionLevel;
    if (e && e.target) {
      compressionLevel = parseInt(e.target.value);
    } else {
      const elem = document.getElementById("compressionLevel");
      if (!elem) return;
      compressionLevel = parseInt(elem.value);
    }
    if (
      isNaN(compressionLevel) ||
      compressionLevel < 0 ||
      compressionLevel > 2
    ) {
      return;
    }
    for (let i = 1; i <= 3; i++) {
      const advancedElem = document.getElementById(
        "advancedCompressionRow" + i
      );
      if (advancedElem) {
        advancedElem.style.display = compressionLevel === 0 ? "none" : "";
      }
    }
  };

  const onFileChange = (e, fileNameLabelID) => {
    const fileNameLabel = document.getElementById(fileNameLabelID);
    const url = e.target.value;
    const lastForwardSlash = url.lastIndexOf("/");
    const lastBackwardSlash = url.lastIndexOf("\\");
    const lastSlash = Math.max(lastForwardSlash, lastBackwardSlash);
    if (fileNameLabel) {
      fileNameLabel.innerHTML = url.substring(lastSlash + 1);
    }
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    } else {
      setFileName("(未选择文件)");
    }
  };

  let conversionInProgress = false;
  const convertPlyFile = () => {
    if (conversionInProgress) return;
    const conversionFile = document.getElementById("conversionFile");
    const compressionLevel = parseInt(
      document.getElementById("compressionLevel").value
    );
    const alphaRemovalThreshold = parseInt(
      document.getElementById("alphaRemovalThreshold").value
    );
    const sphericalHarmonicsDegree = parseInt(
      document.getElementById("conversionSphericalHarmonicsDegree").value
    );
    const sectionSize = 0;
    let sceneCenterArray = document.getElementById("sceneCenter").value;
    const blockSize = parseFloat(document.getElementById("blockSize").value);
    const bucketSize = parseInt(document.getElementById("bucketSize").value);

    sceneCenterArray = sceneCenterArray.split(",");

    if (sceneCenterArray.length !== 3) {
      setConversionError("场景中心点必须包含 3 个坐标");
      return;
    }

    for (let i = 0; i < 3; i++) {
      sceneCenterArray[i] = parseFloat(sceneCenterArray[i]);
      if (isNaN(sceneCenterArray[i])) {
        setConversionError("坐标输入无效");
        return;
      }
    }

    const sceneCenter = new THREE.Vector3().fromArray(sceneCenterArray);

    if (
      isNaN(compressionLevel) ||
      compressionLevel < 0 ||
      compressionLevel > 2
    ) {
      setConversionError("压缩级别无效");
      return;
    } else if (
      isNaN(alphaRemovalThreshold) ||
      alphaRemovalThreshold < 0 ||
      alphaRemovalThreshold > 255
    ) {
      setConversionError("Alpha 删除阈值无效");
      return;
    } else if (
      isNaN(sphericalHarmonicsDegree) ||
      sphericalHarmonicsDegree < 0 ||
      sphericalHarmonicsDegree > 2
    ) {
      setConversionError("SH 级别无效");
      return;
    } else if (isNaN(blockSize) || blockSize < 0.1) {
      setConversionError("Block 块大小无效");
      return;
    } else if (isNaN(bucketSize) || bucketSize < 2 || bucketSize > 65536) {
      setConversionError("Bucket 桶大小无效");
      return;
    } else if (!conversionFile.files[0]) {
      setConversionError("请选择要转换的文件");
      return;
    }
    setConversionError("");
    const convertButton = convertButtonRef.current;

    const conversionDone = (error) => {
      if (error) {
        console.error(error);
        setConversionError("无法转换文件");
      } else {
        setConversionStatus("转换成功");
        setConversionLoadingIconVisibility(false);
        setConversionSuccessIconVisibility(true);
      }
      convertButton.disabled = false;
      conversionInProgress = false;
    };
    try {
      const fileReader = new FileReader();
      fileReader.onload = function () {
        convertButton.disabled = true;
        setConversionStatus("解析文件中...");
        setConversionLoadingIconVisibility(true);
        setConversionSuccessIconVisibility(false);
        const conversionFileName = conversionFile.files[0].name.trim();
        const format =
          GaussianSplats3D.LoaderUtils.sceneFormatFromPath(conversionFileName);
        const fileData = { data: fileReader.result };

        setTimeout(() => {
          try {
            const splatBufferPromise = fileBufferToSplatBuffer(
              fileData,
              format,
              alphaRemovalThreshold,
              compressionLevel,
              sectionSize,
              sceneCenter,
              blockSize,
              bucketSize,
              sphericalHarmonicsDegree
            );
            splatBufferPromise
              .then((splatBuffer) => {
                GaussianSplats3D.KSplatLoader.downloadFile(
                  splatBuffer,
                  "converted_file.ksplat"
                );
                conversionDone();
              })
              .catch(conversionDone);
          } catch (e) {
            conversionDone(e);
          }
        }, 100);
      };
      conversionInProgress = true;
      setConversionStatus("加载文件中...");
      setConversionLoadingIconVisibility(true);
      fileReader.readAsArrayBuffer(conversionFile.files[0]);
    } catch (e) {
      conversionDone(e);
    }
  };
  const setConversionError = (msg) => {
    setConversionLoadingIconVisibility(false);
    setConversionSuccessIconVisibility(false);
    const statusElem = document.getElementById("conversionStatus");
    const errorElem = document.getElementById("conversionError");
    if (statusElem) statusElem.textContent = "";
    if (errorElem) errorElem.textContent = msg;
  };

  const setConversionStatus = (msg) => {
    const statusElem = document.getElementById("conversionStatus");
    const errorElem = document.getElementById("conversionError");
    if (errorElem) errorElem.textContent = "";
    if (statusElem) statusElem.textContent = msg;
  };

  const setConversionLoadingIconVisibility = (visible) => {
    const elem = document.getElementById("conversion-loading-spinner");
    if (elem) elem.style.display = visible ? "inline-block" : "none";
  };

  const setConversionSuccessIconVisibility = (visible) => {
    const elem = document.getElementById("conversion-success-icon");
    if (elem) elem.style.display = visible ? "inline-block" : "none";
  };
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">HairVision</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>优化文件格式</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="container mx-auto p-8 space-y-8">
          {/* 优化文件格式块 */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">优化文件格式</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-gray-600 dark:text-gray-300">
                  <p>
                    将{" "}
                    <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                      .ply
                    </span>{" "}
                    或{" "}
                    <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                      .splat
                    </span>{" "}
                    格式的 3D 模型文件转换为更高效的{" "}
                    <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                      .ksplat
                    </span>{" "}
                    格式，以便在 HairVision 平台上获得更好的加载性能和渲染效果。
                  </p>
                  <p>
                    转换后的文件将保留原始模型的高质量细节，同时显著提升加载速度。
                  </p>
                </div>

                {/* 文件选择 */}
                <div className="flex items-center space-x-4">
                  <Button
                    variant="theme-toggle"
                    className="!bg-background/80 !border !border-input/80 !shadow-sm hover:!bg-accent/30 dark:hover:!bg-accent/20 !text-foreground"
                    onClick={() =>
                      document.getElementById("conversionFile").click()
                    }
                  >
                    选择文件
                  </Button>

                  {/* 利用 shadcn/ui 的 Input 展示选中文件名，设置 readOnly 防止手动编辑 */}
                  <Input
                    type="text"
                    value={fileName}
                    readOnly
                    className="max-w-xs"
                  />

                  {/* 隐藏的文件 input，真正用来选择文件 */}
                  <input
                    type="file"
                    id="conversionFile"
                    className="hidden"
                    onChange={onFileChange}
                  />
                </div>
                {/* 参数输入 */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <label className="w-40">最小 Alpha 值:</label>
                    <Input
                      id="alphaRemovalThreshold"
                      type="text"
                      defaultValue="1"
                      className="w-20"
                    />
                    <span className="text-sm text-gray-500">(1 - 255)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="w-40">场景中心点:</label>
                    <Input
                      id="sceneCenter"
                      type="text"
                      defaultValue="0, 0, 0"
                      className="w-40"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="w-40">压缩率:</label>
                    <Input
                      id="compressionLevel"
                      type="text"
                      defaultValue="1"
                      className="w-20"
                      onChange={onCompressionLevelChange}
                    />
                    <span className="text-sm text-gray-500">(0, 1, 或 2)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="w-40">SH 级别:</label>
                    <Input
                      id="conversionSphericalHarmonicsDegree"
                      type="text"
                      defaultValue="0"
                      className="w-20"
                    />
                    <span className="text-sm text-gray-500">(0, 1, 或 2)</span>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium">高级压缩选项</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <label className="w-40">Block 块大小:</label>
                    <Input
                      id="blockSize"
                      type="text"
                      defaultValue="5.0"
                      className="w-20"
                    />
                    <span className="text-sm text-gray-500">(≥ 0.1)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="w-40">Bucket 桶大小:</label>
                    <Input
                      id="bucketSize"
                      type="text"
                      defaultValue="256"
                      className="w-20"
                    />
                    <span className="text-sm text-gray-500">(2 - 65536)</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    variant="theme-toggle"
                    className="!bg-background/80 !border !border-input/80 !shadow-sm hover:!bg-accent/30 dark:hover:!bg-accent/20 !text-foreground"
                    ref={convertButtonRef}
                    onClick={convertPlyFile}
                  >
                    转换
                  </Button>
                </div>

                {/* 状态提示 */}
                <div className="flex items-center space-x-2 mt-4">
                  <div
                    id="conversion-loading-spinner"
                    className="loading-spinner"
                    style={{ display: "none" }}
                  />
                  <i
                    id="conversion-success-icon"
                    className="material-icons text-green-500"
                    style={{ display: "none" }}
                  >
                    check_circle
                  </i>
                  <span id="conversionStatus" className="text-gray-600" />
                  <span id="conversionError" className="text-red-500" />
                </div>

                {/* 转换说明 */}
                <div className="mt-8 text-left">
                  <h4 className="font-semibold text-lg text-black dark:text-white mb-3">
                    转换说明
                  </h4>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 leading-relaxed">
                    <li>
                      <strong className="text-black dark:text-white">
                        最小 Alpha 值：
                      </strong>
                      低于此值的点会被剔除，可以去除半透明噪点。
                    </li>
                    <li>
                      <strong className="text-black dark:text-white">
                        场景中心点：
                      </strong>
                      设置模型的中心位置，一般使用默认值即可。
                    </li>
                    <li>
                      <strong className="text-black dark:text-white">
                        压缩率：
                      </strong>
                      值越高压缩效果越好，但转换时间更长。
                    </li>
                    <li>
                      <strong className="text-black dark:text-white">
                        SH 级别：
                      </strong>
                      球谐函数级别，影响光照效果，值越高质量越好但文件更大。
                    </li>
                    <li>
                      <strong className="text-black dark:text-white">
                        Block 块大小：
                      </strong>
                      空间划分单元大小，影响文件结构。
                    </li>
                    <li>
                      <strong className="text-black dark:text-white">
                        Bucket 桶大小：
                      </strong>
                      每个空间单元内点的最大数量，影响加载性能。
                    </li>
                  </ul>
                  <p className="mt-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    转换完成后，系统会自动下载处理后的{" "}
                    <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                      .ksplat
                    </span>{" "}
                    文件，可直接用于 HairVision 平台中。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 格式说明块 */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">格式说明</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-600 dark:text-gray-300">
                <div>
                  <h4 className="font-medium mb-1">
                    <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                      .ply
                    </span>{" "}
                    格式
                  </h4>
                  <p>
                    PLY 是一种常见的 3D 点云格式，通常由 3D
                    扫描或重建软件生成，保存了点的位置、颜色和其他属性，但加载速度较慢
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">
                    <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                      .splat
                    </span>{" "}
                    格式
                  </h4>
                  <p>
                    SPLAT 格式是 Gaussian Splatting
                    技术特有的格式，保存了高斯点的位置、颜色、不透明度和方向等特性，适合渲染高质量的3D场景
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">
                    <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                      .ksplat
                    </span>{" "}
                    格式
                  </h4>
                  <p>
                    KSPLAT 是针对 Web
                    端优化的格式，在保持高质量的同时，显著提升了加载速度和渲染性能，特别适合在浏览器中展示复杂的
                    3D 发型模型
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 常见问题块 */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">常见问题</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 text-gray-600">
                {[
                  {
                    q: "为什么文件转换后变大了？",
                    a: "当设置较高的 SH 级别时，文件可能会增大，因为更高级别的球谐函数需要存储更多的光照信息。如果文件大小是主要关注点，请考虑使用较低的 SH 级别。",
                  },
                  {
                    q: "转换需要多长时间？",
                    a: "转换时间取决于原始文件的大小和复杂度，以及所选择的压缩级别。大型文件和高压缩级别可能需要更长时间。在转换过程中，请保持页面打开状态。",
                  },
                  {
                    q: "我应该选择哪种压缩级别？",
                    a: "对于一般用途，推荐使用压缩级别 1，其提供了良好的平衡。如果文件大小至关重要，可以选择级别 2；如果希望保持最高质量，可以选择级别 0。",
                  },
                  {
                    q: "转换失败怎么办？",
                    a: "如果转换失败，请检查输入文件是否为有效的 PLY 或 SPLAT 格式。也可能是由于文件过大导致浏览器内存不足，尝试关闭其他标签页或使用更强大的设备。",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="text-left">
                    <h4 className="font-semibold text-base mb-1 text-black dark:text-white">
                      {item.q}
                    </h4>
                    <p className="text-sm leading-relaxed dark:text-gray-300">{item.a}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
