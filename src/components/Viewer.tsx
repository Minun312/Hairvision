import { useNavigate } from "react-router-dom";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Viewer() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [alphaThreshold, setAlphaThreshold] = useState("1");
  const [cameraUp, setCameraUp] = useState("0,1,0");
  const [cameraPosition, setCameraPosition] = useState(
    "-0.02885, 0.064, 0.812"
  );
  const [cameraLookAt, setCameraLookAt] = useState("0,0,0");
  const [shDegree, setShDegree] = useState("0");
  const [antialiased, setAntialiased] = useState(false);
  const [scene2D, setScene2D] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateInputs = () => {
    const alpha = parseInt(alphaThreshold);
    if (isNaN(alpha)) return "Alpha阈值必须为数字";
    if (alpha < 1 || alpha > 255) return "Alpha值范围1-255";

    const sh = parseInt(shDegree);
    if (isNaN(sh) || sh < 0 || sh > 2) return "SH度数必须为0-2";

    const validateVector = (value: string) => {
      const arr = value.split(",").map(Number);
      return arr.length === 3 && !arr.some(isNaN);
    };

    if (!validateVector(cameraUp)) return "相机上方向量格式错误";
    if (!validateVector(cameraPosition)) return "相机位置格式错误";
    if (!validateVector(cameraLookAt)) return "相机目标点格式错误";

    return null;
  };
  const [fileName, setFileName] = useState("(未选择文件)");
  const handleView = async (e) => {
    if (!file) {
      setError("请选择文件");
      return;
    }

    const errorMsg = validateInputs();
    if (errorMsg) {
      setError(errorMsg);
      return;
    }
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    } else {
      setFileName("(未选择文件)");
    }

    setIsLoading(true);
    setError("");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = arrayBufferToBase64(arrayBuffer);

      const params = new URLSearchParams({
        file: file.name,
        data: base64Data,
        alpha: alphaThreshold,
        cu: cameraUp,
        cp: cameraPosition,
        cla: cameraLookAt,
        aa: antialiased.toString(),
        "2d": scene2D.toString(),
        sh: shDegree,
      });

      navigate(`/Universal?${params.toString()}`);
    } catch (err) {
      console.error("文件处理失败:", err);
      setError("文件处理失败");
    } finally {
      setIsLoading(false);
    }
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let result = "";

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      result += String.fromCharCode.apply(null, chunk as unknown as number[]);
    }

    return btoa(result);
  };

  const handleReset = () => {
    setFile(null);
    setAlphaThreshold("1");
    setCameraUp("0,1,0");
    setCameraPosition("-0.02885, 0.064, 0.812");
    setCameraLookAt("0,0,0");
    setShDegree("0");
    setAntialiased(false);
    setScene2D(false);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
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
                <BreadcrumbLink href="/">Hairvision</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>KsplatViewer</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="container mx-auto p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <h3 className="text-lg font-semibold">KsplatViewer</h3>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-black-600 space-y-4 text-left">
                <p>
                  上传{" "}
                  <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                    .ksplat
                  </span>{" "}
                  等点云文件查看3d渲染效果
                </p>
              </div>
              <div className="space-y-6 p-4 max-w-2xl mx-auto">
                <div className="container mx-auto p-1 space-y-1"></div>
                <div className="space-y-2">
                  <Label>3D文件</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="theme-toggle"
                          className="!bg-background/80 !border !border-input/80 !shadow-sm hover:!bg-accent/30 dark:hover:!bg-accent/20 !text-foreground"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          选择文件
                        </Button>
                        <Input
                          type="text"
                          value={fileName}
                          readOnly
                          className="max-w-xs"
                        />

                        <input
                          type="file"
                          accept=".ply,.splat,.ksplat"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={(e) => {
                            const selectedFile = e.target.files?.[0] || null;
                            setFile(selectedFile);
                            setFileName(
                              selectedFile ? selectedFile.name : "(未选择文件)"
                            );
                          }}
                        />
                        <Button
                          variant="outline"
                          className="!bg-background/80 !border !border-input/80 !shadow-sm hover:!bg-accent/30 dark:hover:!bg-accent/20 !text-foreground"
                          onClick={handleReset}
                        >
                          重置
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    支持格式: .ply, .splat, .ksplat
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Alpha阈值 (1-255)</Label>
                      <Input
                        value={alphaThreshold}
                        onChange={(e) =>
                          setAlphaThreshold(
                            e.target.value.replace(/\D/g, "").slice(0, 3)
                          )
                        }
                        placeholder="输入1-255之间的整数"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>SH度数 (0-2)</Label>
                      <Input
                        value={shDegree}
                        onChange={(e) =>
                          setShDegree(
                            e.target.value.replace(/[^0-2]/g, "").slice(0, 1)
                          )
                        }
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Label>抗锯齿</Label>
                      <Input
                        type="checkbox"
                        checked={antialiased}
                        onChange={(e) => setAntialiased(e.target.checked)}
                        className="w-4 h-4"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Label>2D模式</Label>
                      <Input
                        type="checkbox"
                        checked={scene2D}
                        onChange={(e) => setScene2D(e.target.checked)}
                        className="w-4 h-4"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        label: "相机上方向量",
                        value: cameraUp,
                        setter: setCameraUp,
                      },
                      {
                        label: "相机位置",
                        value: cameraPosition,
                        setter: setCameraPosition,
                      },
                      {
                        label: "相机目标点",
                        value: cameraLookAt,
                        setter: setCameraLookAt,
                      },
                    ].map(({ label, value, setter }) => (
                      <div key={label} className="space-y-2">
                        <Label>{label}</Label>
                        <Input
                          value={value}
                          onChange={(e) => {
                            const filtered = e.target.value
                              .replace(/[^0-9,.-]/g, "")
                              .replace(/(\..*)\./g, "$1");
                            setter(filtered);
                          }}
                          placeholder="例如：0,1,0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="space-y-6 p-4 max-w-2xl mx-auto">
                <div className="flex flex-col items-center gap-2">
                  <Button
                    onClick={handleView}
                    className="w-full max-w-xs !bg-background/80 !border !border-input/80 !shadow-sm hover:!bg-accent/30 dark:hover:!bg-accent/20 !text-foreground"
                    disabled={isLoading}
                    variant="outline"
                  >
                    {isLoading ? "处理中..." : "查看模型"}
                  </Button>
                  {error && <div className="text-sm text-red-600">{error}</div>}
                </div>
              </div>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <h3 className="text-lg font-semibold">操作说明</h3>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex-1 text-left space-y-4">
                <h4 className="font-semibold text-base mb-1 text-black dark:text-white">
                  左键单击设置焦点
                </h4>
                <h4 className="font-semibold text-base mb-1 text-black dark:text-white">
                  左键单击并拖动以旋转视角
                </h4>
                <h4 className="font-semibold text-base mb-1 text-black dark:text-white">
                  右键单击并拖动以平移
                </h4>
                <div></div>
                <p className="leading-relaxed">
                  {" "}
                  <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                    I
                  </span>{" "}
                  显示Debug面板
                </p>
                <p className="leading-relaxed">
                  {" "}
                  <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                    C
                  </span>{" "}
                  切换网格光标
                </p>
                <p className="leading-relaxed">
                  {" "}
                  <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                    U
                  </span>{" "}
                  切换控件方向标记
                </p>
                <p className="leading-relaxed">
                  {" "}
                  <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                    &lt;-
                  </span>{" "}
                  逆时针旋转视角
                </p>
                <p className="leading-relaxed">
                  {" "}
                  <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                    -&gt;
                  </span>{" "}
                  顺时针旋转视角
                </p>
                <p className="leading-relaxed">
                  {" "}
                  <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                    P
                  </span>{" "}
                  切换点云视角
                </p>
                <p className="leading-relaxed">
                  {" "}
                  <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                    O
                  </span>{" "}
                  切换正交模式
                </p>
                <p className="leading-relaxed">
                  {" "}
                  <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                    =
                  </span>{" "}
                  增大Splat比例
                </p>
                <p className="leading-relaxed">
                  {" "}
                  <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                    -
                  </span>{" "}
                  减小Splat比例
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
