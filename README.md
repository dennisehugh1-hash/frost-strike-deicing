#  架空线路电磁除冰演示



**仓库：** https://github.com/dennisehugh1-hash/frost-strike-deicing  
**在线演示：** https://dennisehugh1-hash.github.io/frost-strike-deicing/

打开页面即自动循环：覆冰累积 → 储能电容充电 → 晶闸管触发 → 电枢带动导线形变 → 应力波破冰。

## 开启 GitHub Pages（只需一次）

GitHub 要求仓库主人手动打开 Pages。代码已在 `main` 根目录，按下面三步站点即可访问：

1. 打开 [Settings → Pages](https://github.com/dennisehugh1-hash/frost-strike-deicing/settings/pages)
2. Build and deployment → Source 选 **Deploy from a branch**
3. Branch 选 **main**，目录选 **/ (root)**，点 Save

约一分钟后打开 https://dennisehugh1-hash.github.io/frost-strike-deicing/

若页面 404，先确认 GitHub 账号邮箱已验证。

## 操作

- 空格：充电 / 触发冲击
- R：重置档距覆冰
- 充电电压：500 / 1000 / 1500 V
- 线圈间距：4 / 8 / 12 mm
- 覆冰类型：雨淞、硬雾淞、软雾淞

页面分三个视图：现场、线圈、原理。

## 与课件对齐的峰值

参数来自专题讲义第 21 页实测点。储能电容 4000 µF，线圈 20 匝，内径 20 mm、外径 60 mm。

| 电压 | 峰值电流 | 峰值电磁力 | 约形变 |
|------|----------|------------|--------|
| 500 V | 2.21 kA | 4.65 kN | 2.4 cm |
| 1000 V | 4.37 kA | 16.1 kN | 4.4 cm |
| 1500 V | 5.96 kA | 36.0 kN | 6.9 cm |

1500 V、4 mm、雨淞时，近点破裂约 90%。

本仓库是教学演示，不是现场作业规程。

## 本地打开

无需构建。用浏览器直接打开 `index.html`。
