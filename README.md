# 霜击 · 架空线路电磁除冰演示

电容放电驱动平面线圈，电枢经挂钩把瞬态形变送入导线，应力波沿线传播，覆冰在高应变下破裂脱落。

**仓库：** https://github.com/dennisehugh1-hash/frost-strike-deicing  
**在线演示：** https://dennisehugh1-hash.github.io/frost-strike-deicing/

打开页面即自动循环：覆冰累积 → 储能电容充电 → 晶闸管触发 → 电枢带动导线形变 → 应力波破冰。

## 前置需开启 GitHub Pages

GitHub 要求手动打开 Pages。代码已在 `main` 根目录，按下面三步即可访问：

1. 打开 [Settings → Pages](https://github.com/dennisehugh1-hash/frost-strike-deicing/settings/pages)
2. Build and deployment → Source 选 **Deploy from a branch**
3. Branch 选 **main**，目录选 **/ (root)**，点 Save

约一分钟后打开 https://dennisehugh1-hash.github.io/frost-strike-deicing/



## 演示

- 空格：充电 / 触发冲击
- R：重置档距覆冰
- 充电电压：500 / 1000 / 1500 V
- 线圈间距：4 / 8 / 12 mm
- 覆冰类型：雨淞、硬雾淞、软雾淞

页面分两个视图：**现场**（档距应力波与碎冰）、**线圈**（平面线圈 + 运动电枢特写）。理论推导在页底附录。

## 峰值对照

储能电容 4000 μF，线圈 20 匝，内径 20 mm、外径 60 mm。

| 充电电压 | 峰值电流 | 峰值冲击力 | 近点位移（4 mm 气隙） |
| --- | --- | --- | --- |
| 500 V | 2.21 kA | 4.65 kN | ≈ 2.4 cm |
| 1000 V | 4.37 kA | 16.1 kN | ≈ 4.4 cm |
| 1500 V | 5.96 kA | 36.0 kN | ≈ 6.9 cm |

1500 V、4 mm、雨淞时，近点破裂约 90%。气隙增大时互感梯度下降，冲击力与位移按 (4/δ)^0.55 衰减。

## 理论推导

除冰系统用自锁紧挂钩把线缆与敲击杆刚性连接。电容对平面线圈放电，运动电枢被轴向电磁力推出，敲击杆带动导线产生瞬态形变。应力波沿导线双向传播，覆冰在高应变下破裂脱落。

耦合线圈磁能：

```
W_m = 1/2 L1 I1^2 + 1/2 L2 I2^2 + M I1 I2
```

虚功原理给出轴向力：

```
F_x = -∂W_m/∂x = -I1 I2 ∂M/∂x
```

脱冰按两条准则校核：塑性应变 ε_p ≥ ε_pmax，以及惯性力与重力之和超过黏附力与内聚力 F_v + G ≥ F_a + F_c。短时程高幅值载荷比长时程低幅值更有效。

本仓库是原理演示，不是现场作业规程。

## 本地打开

无需构建。用浏览器直接打开 `index.html`。
