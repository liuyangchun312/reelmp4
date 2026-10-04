# 刘杨春 · Motion Reel

60 秒动态图形作品集短片（canvas 逐帧绘制 + numpy 合成配乐 + puppeteer/ffmpeg 渲染）。成片：[reel_web.mp4](reel_web.mp4)

## 准备

```bash
npm install
pip install numpy
```

`fonts/kai.ttf`（华文楷体）和 `fonts/bahn.ttf`（Bahnschrift）为商业字体，未包含在仓库中，请从 Windows 自行复制：

```bash
cp /c/Windows/Fonts/STKAITI.TTF fonts/kai.ttf
cp /c/Windows/Fonts/bahnschrift.ttf fonts/bahn.ttf
```

## 使用

- 预览：浏览器打开 `index.html?t=秒数`，或 `node stills.js 1.0 6.5 ...` 导出关键帧
- 修改时间轴后：`node build-data.js`
- 生成配乐：`python audio.py`
- 渲染：`node render.js 6` → `reel.mp4`
