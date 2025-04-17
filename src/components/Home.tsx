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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
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
                <BreadcrumbPage>关于本项目</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="container mx-auto p-4 space-y-4">
        <Card>
            <CardHeader>
              <CardTitle>
                <h3 className="text-lg font-semibold">Sidebar说明</h3>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <div className="flex-1 text-left space-y-2 ml-10">
                  <p className="leading-relaxed">
                    <li>示例模型：提供了多种模型以供预览</li>
                  </p>
                  <p className="leading-relaxed">
                    <li>跑起来：上传图像并运行Unihair，生成3d模型供下载</li>
                  </p>
                  <p className="leading-relaxed">
                    <li>发型分类：上传图像分类发型</li>
                  </p>
                  <p className="leading-relaxed">
                    <li>优化文件格式：上传点云文件，转换为更高效的格式，提升渲染性能</li>
                  </p>
                  <p className="leading-relaxed">
                    <li>KsplatViewer：上传点云文件以在网页上预览3d模型</li>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <h3 className="text-lg font-semibold">关于本项目</h3>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <div className="flex-1 text-left space-y-2">
                  <h4 className="font-semibold text-base mb-1 text-black dark:text-white">
                    HairVision 是一个基于平面视觉三维重建的发型3D建模平台
                  </h4>
                  <h4 className="font-semibold text-base mb-1 text-black dark:text-white">
                    试图探索计算机视觉和机器学习技术在数字发型设计的潜在落地场景
                  </h4>
                  <p className="leading-relaxed">
                    <li>高可用</li>
                  </p>
                  <p className="leading-relaxed">
                    <li>细致、真实</li>
                  </p>
                  <p className="leading-relaxed">
                    <li>细节特征提取</li>
                  </p>
                  <p className="leading-relaxed">
                    <li>二维图像 -&gt; 三维模型</li>
                  </p>
                </div>
                <div className="w-50 shrink-0">
                  <img
                    src="assets/HomeImage/0.png"
                    alt="概念"
                    className="w-full h-auto object-cover rounded-xl"
                  />
                </div>
              </div>
              <div className="w-full my-4">
                <img
                  src="assets/HomeImage/2.png"
                  alt="项目示意图"
                  className="w-[600px] mx-auto h-auto object-cover rounded-xl"
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <h3 className="text-lg font-semibold">应用场景</h3>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <div className="w-80 shrink-0">
                  <img
                    src="assets/HomeImage/3.png"
                    alt="概念"
                    className="w-full h-auto object-cover rounded-xl"
                  />
                </div>
                <div className="flex-1 text-left space-y-2 ml-10">
                  <h4 className="font-semibold text-base mb-1 text-black dark:text-white">
                    Tony 的下一个选择
                  </h4>
                  <p className="leading-relaxed">
                    <li>快速的发型重建预览服务</li>
                  </p>
                  <p className="leading-relaxed">
                    <li>元宇宙的个性化基础设施</li>
                  </p>
                  <p className="leading-relaxed">
                    <li>时尚设计的新范式</li>
                  </p>
                  <p className="leading-relaxed">
                    <li>内容创作的新素材</li>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <h3 className="text-lg font-semibold">设计思路</h3>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-left space-y-2">
                <h4 className="font-semibold text-base mb-1 text-black dark:text-white">
                  加速, 再减速
                </h4>
                <p className="leading-relaxed">
                  <li>遵循敏捷开发的迭代模式</li>
                </p>
                <p className="leading-relaxed">
                  <li>先借助现有框架部分满足功能需求</li>
                </p>
                <p className="leading-relaxed">
                  <li>而后关注细节，逐步进行技术优化</li>
                </p>
                <div className="container mx-auto p-1"></div>
                <p className="leading-relaxed font-semibold">
                  1. 数据爬取与预处理
                </p>
                <p className="leading-relaxed">
                  SynMvHair 数据集，Alignment 身体对齐，3DDFA
                  面部检测，Efficient SAM 标注和掩膜分割
                </p>
                <p className="leading-relaxed font-semibold">
                  2. 模型训练与测试
                </p>
                <p className="leading-relaxed">
                  3D Gaussian Splatting 视图级和像素级的高斯优化 Coarse, Refine,
                  Enhance 递进训练
                </p>
                <p className="leading-relaxed font-semibold">
                  3. 后期优化和微调
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <h3 className="text-lg font-semibold">技术实现进展</h3>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-left space-y-2">
                <div className="text-left space-y-2">
                  <h4 className="font-semibold text-base mb-1 text-black dark:text-white">
                    SAM 图像分割标注
                  </h4>
                  <div className="w-full my-4">
                    <img
                      src="assets/HomeImage/4.png"
                      alt="SAM"
                      className="w-[600px] mx-auto h-auto object-cover rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="flex-1 text-left space-y-2">
                    <p className="leading-relaxed">根据用户输入</p>
                    <p className="leading-relaxed">
                      利用Transformer的自注意力机制进行图像标注
                    </p>
                    <p className="leading-relaxed">分割出发型的掩膜</p>
                    <div className="container mx-auto p-5"></div>
                    <p className="leading-relaxed">吞吐&lt;-&gt;性能权衡</p>
                    <p className="leading-relaxed">
                      采用 EfficientViT SAM 模型
                    </p>
                  </div>
                  <div className="w-100 shrink-0">
                    <img
                      src="assets/HomeImage/5.png"
                      alt="SAM"
                      className="w-full h-auto object-cover rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex justify-center items-start gap-8 mt-6">
                  <div className="flex flex-col items-center w-60 shrink-0">
                    <img
                      src="assets/HomeImage/6.png"
                      alt="Step1"
                      className="w-full h-auto object-cover rounded-xl"
                    />
                    <p className="leading-relaxed mt-2">粗糙云图</p>
                  </div>
                  <div className="flex flex-col items-center w-60 shrink-0">
                    <img
                      src="assets/HomeImage/7.png"
                      alt="Step2"
                      className="w-full h-auto object-cover rounded-xl"
                    />
                    <p className="leading-relaxed mt-2">视图级高斯优化后</p>
                  </div>
                  <div className="flex flex-col items-center w-60 shrink-0">
                    <img
                      src="assets/HomeImage/8.png"
                      alt="Step3"
                      className="w-full h-auto object-cover rounded-xl"
                    />
                    <p className="leading-relaxed mt-2">像素级高斯优化后</p>
                  </div>
                </div>
                <p className="leading-relaxed font-semibold text-center">
                  文献参考+框架改进-基于UniHair进行重构
                </p>
                <div className="container mx-auto p-4 space-y-1"></div>
                <div className="flex items-start gap-6">
                  <div className="w-80 shrink-0">
                    <img
                      src="assets/HomeImage/8.png"
                      alt="概念"
                      className="w-full h-auto object-cover rounded-xl"
                    />
                    <p className="leading-relaxed text-center mt-2">
                      Point Cloud 点云图
                    </p>
                  </div>
                  <div className="flex-1 text-left space-y-2 ml-10">
                    <h4 className="font-semibold text-base mb-1 text-black dark:text-white">
                      点云
                    </h4>
                    <p className="leading-relaxed">Gaussians 高斯点模拟点云</p>
                    <p className="leading-relaxed">
                      记录位置、半径和透明度等属性
                    </p>
                    <p className="leading-relaxed">
                      生成 Point Cloud ply 工程文件
                    </p>
                    <p className="leading-relaxed">用于最终的 3D 重建</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <h3 className="text-lg font-semibold">成果&未来展望</h3>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <div className="flex-1 text-left space-y-2">
                  <p className="leading-relaxed">文本发型生成</p>
                  <p className="leading-relaxed">适应更复杂的场景特征</p>
                  <p className="leading-relaxed">吞吐&lt;-&gt;性能权衡</p>
                  <p className="leading-relaxed">
                    实时渲染能力：适配移动端平台
                  </p>
                </div>
                <div className="w-90 shrink-0">
                  <img
                    src="assets/HomeImage/1.png"
                    alt="概念"
                    className="w-full h-auto object-cover rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <h3 className="text-lg font-semibold">TEAM</h3>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-left space-y-2">
                <p className="leading-relaxed">
                  指导老师：何淑婷{" "}
                  <a href="https://simecv.sufe.edu.cn">simecv.sufe.edu.cn</a>
                </p>
                <p className="leading-relaxed">
                  组长：吴镔 <a>minunplus312@gmail.com</a>
                </p>
                <p className="leading-relaxed">组员：倪泽远 张华轩</p>
                <p className="leading-relaxed text-center">SIME@Sufe 2025</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
