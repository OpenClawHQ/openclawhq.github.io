# 远程 vs 本地 对比结果

## 差异概览

- **有内容差异的已跟踪文件**：只有 **index.html**（约 47 行差异，主要是 padding、间距等样式）。
- **仅本地有的已跟踪文件**：无。
- **仅远程有的已跟踪文件**：无。
- **本地未跟踪**：`PAGES_CHECK.md`（Pages 配置检查说明）、`dist/`（构建产物）。

## 本地多出的 2 个提交

1. `ee2792c` — docs: update index and hq index  
2. `5187383` — merge origin/main: resolve index.html conflicts, accept remote structure  

合并时虽采用了远程结构，但合并后的 index.html 与当前远程仍不完全一致（例如 .shell 的 padding 等），所以你看到的「远端 UI」对应的是 **origin/main 的 index.html**。

## 处理建议（你更喜欢远端 UI）

1. **以远程的 index.html 为准**  
   用远程版本覆盖本地：  
   `git checkout origin/main -- index.html`  
   这样本地展示效果会和现在远端一致。

2. **保留本地有价值且仅本地的内容**  
   - **PAGES_CHECK.md**：建议加入版本库并提交，方便以后查 Pages 配置。  
   - **dist/**：建议加入 `.gitignore`，不提交构建产物，避免冲突和仓库变大。

3. **不再把本地 index 推回去覆盖远程**  
   之后若改版，在本地改完 index.html 再 push 即可；当前这一步只做「本地对齐远程 UI + 保留 PAGES_CHECK + 忽略 dist」。

如你同意，我可以按上述 3 步在仓库里直接改好并写好提交信息，你只需 `git push`。

---

## 保持云上与本地一致

当前本地已与远端对齐（同一提交）。之后若在别处改过远端，在本机执行即可与云端一致：

```bash
cd openclawHQ.github.io
git fetch origin && git reset --hard origin/main
```
