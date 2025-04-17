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
import DemoCard from "../components/DemoCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const demoData = [
  { title: "Curly 卷发", image: "/assets/images/curly.jpg", page: "curly" },
  {
    title: "Dreadlocks 脏辫",
    image: "/assets/images/dreadlocks.jpg",
    page: "dreadlocks",
  },
  { title: "Kinky 爆炸发", image: "/assets/images/kinky.jpg", page: "kinky" },
  {
    title: "Stright 直发",
    image: "/assets/images/stright.jpg",
    page: "stright",
  },
  { title: "Wavy 波浪发", image: "/assets/images/wavy.jpg", page: "wavy" },
  {
    title: "Kinky 波浪发 2",
    image: "/assets/images/kinky2.jpg",
    page: "kinky2",
  },
  { title: "Wavy 波浪发 2", image: "/assets/images/wavy2.jpg", page: "wavy2" },
];

export default function ModelEx() {
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
                <BreadcrumbPage>示例模型</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="container mx-auto p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <h3 className="text-lg font-semibold">示例模型</h3>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-black-600 space-x-8 text-left ">
                <p>有5类不同的发型可供预览，共7个示例模型</p>
              </div>
              <div className="container mx-auto p-4 space-y-4"></div>
              <div className="grid gap-4 md:grid-cols-2">
                {demoData.map((demo, idx) => (
                  <DemoCard key={idx} {...demo} />
                ))}
              </div>
            </CardContent>
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
