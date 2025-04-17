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
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Classify() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");
  const [fileName, setFileName] = useState("(未选择文件)");
  const [loading, setLoading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const localServerUrl = "http://127.0.0.1:5000";
  const remoteServerUrl = "http://127.0.0.1:6005";

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    } else {
      setFileName("(未选择文件)");
    }
    setResult("");
  };

  const handleClassify = async (serverUrl, isRemote = false) => {
    if (!file) {
      setResult("请先选择一个文件");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${serverUrl}/classify`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        console.error("请求失败:", res.statusText);
        setResult(`${isRemote ? "远程" : "本地"}上传失败，请稍后再试。`);
        return;
      }

      const data = await res.json();

      if (data) {
        const entries = Object.entries(data);
        const maxEntry = entries.reduce(
          (max, current) => (current[1] > max[1] ? current : max),
          ["", 0]
        );
        const [maxClass, maxProb] = maxEntry;

        setResult(
          <>
            <div>{isRemote ? "远程" : "本地"}预测结果：</div>
            <div>
              最高概率类别：
              <strong>
                {maxClass} ({(maxProb * 100).toFixed(2)}%)
              </strong>
            </div>
            <hr style={{ margin: "5px 0" }} />
            {entries.map(([className, prob]) => (
              <div key={className}>
                {className}: {(prob * 100).toFixed(2)}%
              </div>
            ))}
          </>
        );
      } else {
        setResult(`无法获取${isRemote ? "远程" : "本地"}预测结果`);
      }
    } catch (error) {
      console.error(`${isRemote ? "远程" : "本地"}分类请求错误:`, error);
      setResult(`${isRemote ? "远程" : "本地"}分类请求出错，请检查网络连接`);
    } finally {
      setLoading(false);
    }
  };

  const handleLocalClassify = () => handleClassify(localServerUrl, false);

  const handleRemoteClassify = () => handleClassify(remoteServerUrl, true);

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
                <BreadcrumbPage>发型分类</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="container mx-auto p-4 space-y-4"></div>
        <Card>
          <CardHeader>
            <CardTitle>
              <h3 className="text-lg font-semibold">发型分类</h3>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-black-600 space-x-8 text-left">
                <p>上传一张图像，自动归类为</p>
              </div>
              <div className="text-black-600 space-x-8 text-left">
                <p>"Straight"，"Wavy"，"curly"，"dreadlocks"，"kinky"</p>
              </div>
              <div className="text-black-600 space-x-8 text-left">
                <p>中的一种，并显示每一类的推测概率</p>
              </div>
              <div className="flex items-center space-x-8">
                <Button
                  variant="theme-toggle"
                  onClick={() => fileInputRef.current?.click()}
                  className="!bg-background/80 !border !border-input/80 !shadow-sm hover:!bg-accent/30 dark:hover:!bg-accent/20 !text-foreground"
                >
                  <span className="flex items-center">选择文件</span>
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
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
              </div>
              <div className="space-y-6 p-4 max-w-2xl mx-auto">
                <div className="flex justify-center space-x-4">
                  <Button
                    variant="theme-toggle"
                    className="!bg-background/80 !border !border-input/80 !shadow-sm hover:!bg-accent/30 dark:hover:!bg-accent/20 !text-foreground"
                    onClick={handleLocalClassify}
                    disabled={loading}
                  >
                    {loading ? "处理中..." : "本地分类"}
                  </Button>

                  <Button
                    variant="theme-toggle"
                    className="!bg-background/80 !border !border-input/80 !shadow-sm hover:!bg-accent/30 dark:hover:!bg-accent/20 !text-foreground"
                    onClick={handleRemoteClassify}
                    disabled={loading}
                  >
                    {loading ? "处理中..." : "远程分类"}
                  </Button>
                </div>

                {loading && (
                  <div className="flex justify-center items-center mt-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                  </div>
                )}

                {result && (
                  <div className="mt-4 p-4 border rounded">{result}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </SidebarInset>
    </SidebarProvider>
  );
}
