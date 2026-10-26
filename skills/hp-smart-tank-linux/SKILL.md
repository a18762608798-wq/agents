---
name: hp-smart-tank-linux
disable-model-invocation: true
description: 在 Linux Mint/Ubuntu 上安装调试 HP Smart Tank 750/755（含打印队列、HPLIP 插件、ipp-usb、SANE 扫描），以及用命令行扫描单页/ADF 批量多页并合成 PDF。当用户提到 HP Smart Tank、755/750、HPLIP、hp-setup、scanimage、airscan、eSCL、文档扫描仪连不上、hpaio I/O 错误、批量扫描合成 PDF 时使用此 skill。
---

# HP Smart Tank Linux（750/755）安装与扫描

适用：Linux Mint 21+/22、Ubuntu 22.04+，USB 连接的 HP Smart Tank 750 series（含 755）。
结论：不需要 Windows。打印+扫描在 HPLIP 均标 `Full`（最低 HPLIP 3.21.8，需闭源 plugin）。

## 1. 安装（一次）

```bash
sudo apt update && sudo apt install hplip simple-scan sane-airscan ipp-usb python3-pil
# 可选：sudo apt install hplip-gui xsane
hp-plugin
hp-setup
```

说明：`hp-plugin` 必装（该系列 `Driver Plug-in: Yes`）。`hp-setup` 建 HPLIP 队列。

## 2. 诊断（按序跑，全部非交互、带超时）

```bash
lsusb | grep -i hp
lpstat -p -d
dpkg -l hplip sane-airscan ipp-usb | cat
cat /var/lib/hp/hplip.state   # installed = 1 即插件就绪
timeout 5 ipp-usb status
timeout 10 airscan-discover
timeout 20 scanimage -d "airscan:e0:HP Smart Tank 750 series [F8AC5C] (USB)" -A | head -n 20
timeout 20 hp-check -r 2>&1 | grep -E "error|MISSING|INCOMPAT" | head
```

判读：

- `lpstat` 有 `Smart_Tank_750`（`hp:/usb/...`）且空闲即打印就绪。`hp-check` 报 `CUPS INCOMPAT` 在 Mint 上是误报，以 `lpstat` 为准。
- `ipp-usb status` 显示 `Bus 001 Device ... "HP Smart Tank 750 series" status: OK` 即 USB 已被接管。
- `airscan-discover` 应列出 `http://127.0.0.1:60000/eSCL/`。`hpaio:/usb/... -A` 报 `Error during device I/O` 是正常的——ipp-usb 接管后 hpaio/`hp-scan` 必然失败，改走 airscan/eSCL，不要修 hpaio。

## 3. 打印

用 HPLIP 队列 `Smart_Tank_750`（功能全），不要用 `implicitclass` 免驱队列。

```bash
lpstat -p -d
lp -d Smart_Tank_750 文件.pdf
lp -d Smart_Tank_750 /usr/share/cups/data/testprint
sudo lpadmin -d Smart_Tank_750   # 设默认，免每次选
```

## 4. 扫描（关键：只用 airscan/eSCL）

两个等价设备名（airscan 优先，simple-scan 只认它）：

- `airscan:e0:HP Smart Tank 750 series [F8AC5C] (USB)`
- `escl:http://127.0.0.1:60000/eSCL/`

纸在哪扫哪：玻璃板朝下贴左上角用 `--source Flatbed`，顶上进稿器朝上用 `--source ADF`。白页（平均亮度约 240+/255）即源选错，换另一个。

单页平板到 PDF：

```bash
timeout 60 scanimage -d "airscan:e0:HP Smart Tank 750 series [F8AC5C] (USB)" --source Flatbed --mode Color --resolution 300 --format=png > /tmp/scan.png 2>/tmp/scan.log && python3 -c "from PIL import Image; im=Image.open('/tmp/scan.png'); im.save('/home/mintusr/scan.pdf','PDF')" && ls -lh ~/scan.pdf
```

单页 ADF（单面）同上，把 `--source Flatbed` 改 `--source ADF`。文字稿分辨率用 150，图片用 300。输出路径写绝对路径，避免相对路径存到别的 cwd。

连续批量（进稿器叠好，空了停，页数不定）：

```bash
rm -f /tmp/p-*.png; timeout 300 scanimage -d "airscan:e0:HP Smart Tank 750 series [F8AC5C] (USB)" --source ADF --mode Color --resolution 300 --format png --batch=/tmp/p-%d.png 2>/tmp/batch.log; echo EXIT:$?; ls /tmp/p-*.png; python3 -c "import glob; from PIL import Image; f=sorted(glob.glob('/tmp/p-*.png')); im=[Image.open(x) for x in f]; im[0].save('/home/mintusr/scan.pdf',save_all=True,append_images=im[1:] if len(im)>1 else []); print(len(f),'pages ok')"; ls -lh ~/scan.pdf
```

固定 N 页（到数即停，不等空）：加 `--batch-count=N`，合并把通配改固定序号。空稿退出非零是正常的，合并用 `;` 不用 `&&`。

## 5. 文档扫描仪（simple-scan 46）排错

- 46.0 的 `首选项` 里没有扫描仪下拉（老教程过时），不要找。
- 报 `无法连接到扫描仪` 多半是选中了坏的 `hpaio`。钉到 airscan：

```bash
gsettings set org.gnome.SimpleScan selected-device 'airscan:e0:HP Smart Tank 750 series [F8AC5C] (USB)'
```

- 点图标没反应：它是单实例，残留进程会吞掉新窗口。清掉重开，启动枚举约 6~7 秒，耐心等 10 秒：

```bash
pkill -x simple-scan; sleep 1
simple-scan "airscan:e0:HP Smart Tank 750 series [F8AC5C] (USB)" &
```

- 取证：`pkill -x simple-scan; simple-scan -d`，点扫描后贴终端末 30 行，找 `sane_open.*failed`。
- 替代：前端坏不影响后端，命令行永远可用；`hp-scan` 别用（走 hpaio，必错）。
