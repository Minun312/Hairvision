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
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, StopCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function Run3dgs() {
  const [file, setFile] = useState<File | null>(null);
  const [downloadLinks, setDownloadLinks] = useState<{
    enhance: string;
    refine: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("(未选择文件)");
  const [processingOutput, setProcessingOutput] = useState<string[]>([]);
  const [showOutput, setShowOutput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processId, setProcessId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (outputRef.current && showOutput) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [processingOutput, showOutput]);

  useEffect(() => {
    return () => {
      if (loading && processId) {
        cancelProcessing();
      }
    };
  }, [loading, processId]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (loading && processId) {
        fetch(`http://127.0.0.1:5001/cancel/${processId}`, {
          method: "POST",
          keepalive: true,
        }).catch(() => {});

        e.preventDefault();
        e.returnValue = "处理正在进行中，确定要离开吗？";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [loading, processId]);

  const cancelProcessing = async () => {
    if (processId) {
      setProcessingOutput((prev) => [...prev, "正在尝试取消处理...\n"]);

      try {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }

        const cancelResponse = await fetch(
          `http://127.0.0.1:5001/cancel/${processId}`,
          {
            method: "POST",
          }
        );

        const cancelResult = await cancelResponse.json();
        console.log("取消处理结果:", cancelResult);

        if (cancelResponse.ok) {
          setProcessingOutput((prev) => [
            ...prev,
            `取消成功: ${cancelResult.message}\n`,
          ]);
        } else {
          setProcessingOutput((prev) => [
            ...prev,
            `取消失败: ${cancelResult.message}\n`,
          ]);
        }
      } catch (err) {
        console.error("取消处理错误", err);
        setProcessingOutput((prev) => [
          ...prev,
          `取消过程中发生错误: ${
            err instanceof Error ? err.message : "未知错误"
          }\n`,
        ]);
      } finally {
        setProcessId(null);
        setLoading(false);
      }
    }
  };

  const handleUploadWithStream = async (useRemote: boolean = false) => {
    if (!file) return;

    setLoading(true);
    setShowOutput(true);
    setProcessingOutput(["开始处理，请稍候...\n"]);
    setDownloadLinks(null);
    setError(null);
    setProcessId(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiUrl = useRemote
        ? "http://127.0.0.1:6006/run-unihair"
        : "http://127.0.0.1:5001/run-unihair";

      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`服务器返回错误: ${response.status}`);
      }

      const receivedProcessId = response.headers.get("X-Process-ID");
      if (receivedProcessId) {
        setProcessId(receivedProcessId);
      }

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const data = await response.json();
        if (data.error) {
          setError(data.error);
        } else {
          setDownloadLinks(data);
        }
        setLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("无法读取响应流");
      }

      const decoder = new TextDecoder();
      let accumulatedOutput = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        accumulatedOutput += text;

        const lines = accumulatedOutput.split("\n");

        accumulatedOutput = lines.pop() || "";

        setProcessingOutput((prev) => [
          ...prev,
          ...lines.map((line) => line + "\n"),
        ]);

        const outputText = lines.join("\n");
        const enhanceMatch = outputText.match(
          /增强文件: (\/download\/[\w\d_]+\.ply)/
        );
        const refineMatch = outputText.match(
          /精细文件: (\/download\/[\w\d_]+\.ply)/
        );

        if (enhanceMatch && refineMatch) {
          setDownloadLinks({
            enhance: enhanceMatch[1],
            refine: refineMatch[1],
          });
        }
      }

      if (accumulatedOutput) {
        setProcessingOutput((prev) => [...prev, accumulatedOutput]);
      }
    } catch (err) {
      console.error("处理错误", err);

      if (err instanceof DOMException && err.name === "AbortError") {
        setProcessingOutput((prev) => [...prev, "用户取消了请求\n"]);
      } else {
        setError(err instanceof Error ? err.message : "未知错误");
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
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
                <BreadcrumbPage>跑起来</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="container mx-auto p-4 space-y-4">
          <Card>
          <CardHeader>
            <CardTitle>
              <h3 className="text-lg font-semibold">运行Unihair</h3>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-left space-y-4">
              <p>上传一张图像，生成两个阶段的文件：（在线网页无后端）</p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-black-600 space-x-8 text-left">
                    Enhance
                  </span>
                  <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                    .ply
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-black-600 space-x-8 text-left">
                    Refine
                  </span>
                  <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                    .ply
                  </span>
                </div>
              </div>
            </div>
            <div className="max-w-md mx-auto p-4 space-y-6">
              <div className="flex items-center space-x-8">
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
                  className="max-w-xs"
                  readOnly
                />

                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0] || null;
                    setFile(selectedFile);
                    setFileName(
                      selectedFile ? selectedFile.name : "(未选择文件)"
                    );
                  }}
                  ref={fileInputRef}
                />
              </div>

                <div className="flex justify-center space-x-4">
                  {!loading ? (
                    <>
                      <Button
                        variant="outline"
                        className="!bg-background/80 !border !border-input/80 !shadow-sm hover:!bg-accent/30 dark:hover:!bg-accent/20 !text-foreground"
                        onClick={() => handleUploadWithStream(false)}
                        disabled={!file || loading}
                      >
                        本地运行 UniHair
                      </Button>

                      <Button
                        variant="outline"
                        className="!bg-background/80 !border !border-input/80 !shadow-sm hover:!bg-accent/30 dark:hover:!bg-accent/20 !text-foreground"
                        onClick={() => handleUploadWithStream(true)}
                        disabled={!file || loading}
                      >
                        云端运行 UniHair
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="destructive"
                        className="!bg-background/80 !border !border-input/80 !shadow-sm hover:!bg-accent/30 dark:hover:!bg-accent/20 !text-foreground"
                        onClick={cancelProcessing}
                      >
                        <StopCircle className="h-4 w-4" />
                        取消处理
                      </Button>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>处理中...</span>
                      </div>
                    </>
                  )}
                </div>

                {showOutput && (
                  <Card className="mt-4">
                    <CardHeader className="py-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        处理输出
                      </CardTitle>
                      {processId && (
                        <Badge variant="outline" className="font-mono text-xs">
                          进程ID: {processId.substring(0, 8)}...
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea
                        className="h-64 rounded border bg-muted/50 p-4"
                        ref={outputRef}
                      >
                        <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap">
                          {processingOutput.join("")}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {downloadLinks && (
                  <div className="flex justify-center space-x-4 mt-6">
                    <a
                      href={`http://127.0.0.1:5001${downloadLinks.enhance}`}
                      download
                    >
                      <Button variant="!bg-background/80 !border !border-input/80 !shadow-sm hover:!bg-accent/30 dark:hover:!bg-accent/20 !text-foreground" className="text-primary">
                        下载 Enhance 文件
                      </Button>
                    </a>

                    <a
                      href={`http://127.0.0.1:5001${downloadLinks.refine}`}
                      download
                    >
                      <Button variant="!bg-background/80 !border !border-input/80 !shadow-sm hover:!bg-accent/30 dark:hover:!bg-accent/20 !text-foreground" className="text-primary">
                        下载 Refine 文件
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
