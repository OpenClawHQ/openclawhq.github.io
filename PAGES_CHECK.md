# GitHub Pages 配置检查（组织官网）

当前访问 **https://openclawhq.github.io** 返回 404，说明 Pages 尚未正确开启或未完成发布。按下面逐项检查即可。

---

## 1. 仓库可见性

- 打开：**https://github.com/OpenClawHQ/openclawhq.github.io**
- **Settings** → 拉到 **Danger Zone**
- 若为 **Private**，先改为 **Public**（免费账号下 Pages 仅支持公开仓库）

---

## 2. 开启 Pages

- 同一仓库 **Settings** → 左侧 **Pages**
- **Build and deployment**：
  - **Source**：选 **Deploy from a branch**
  - **Branch**：选 `main`
  - **Folder**：选 **/ (root)**（本站 `index.html` 在仓库根目录）
- 点 **Save**

---

## 3. 生效时间

- 保存后等 1～3 分钟，再访问 **https://openclawhq.github.io**
- 若仍 404，在 **Settings → Pages** 看是否有报错（如 build 失败），或再等几分钟

---

## 4. 当前仓库结构（供参考）

- 根目录有 **index.html**，故 Source 选 **/ (root)** 即可。
- 若以后改为从 `docs/` 或 `dist/` 发布，再在 Pages 里把 **Folder** 改成对应目录。
