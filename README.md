# HairVision 发型 3D 建模平台

HairVision 是一个基于平面视觉三维重建的发型 3D 建模平台，试图探索计算机视觉和机器学习技术在数字发型设计的潜在落地场景

- 高可用
- 细致、真实
- 细节特征提取
- 二维图像 -> 三维模型

## Running 运行

在项目根目录安装必要的环境和依赖：

```
npm install

conda env create -f environment.yml
```

接下来启动后端服务，运行：

```
conda activate unihair

python backend.py
```

最后运行以下命令在本地查看项目效果：

```
npm run dev
```

在本地访问 [http://localhost:5173](http://localhost:5173) 即可
