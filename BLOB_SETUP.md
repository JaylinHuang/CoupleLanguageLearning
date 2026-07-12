# Vercel Blob — 作业录音存储

Erika 提交作业录音时，开启 Blob 后文件会存到 Vercel 云存储，而不是塞进数据库。

---

## 第 1 步：在 Vercel 创建 Blob 存储

1. 打开 [vercel.com/dashboard](https://vercel.com/dashboard)
2. 进入项目 **jaylin-love-erika**
3. 顶部点 **Storage**（或左侧 **Storage**）
4. 点 **Create Database / Store** → 选 **Blob**
5. 名称建议：`jaylin-erika-audio`
6. 选 **Continue** → **Connect to jaylin-love-erika**

Blob 连接成功后，Vercel 会自动添加（无需手动创建）：

- `BLOB_STORE_ID` — 已有 ✅
- `BLOB_READ_WRITE_TOKEN` — 部分项目会有；没有也没关系，线上会用 OIDC 认证

还可能有 `BLOB_WEBHOOK_PUBLIC_KEY`（webhook 用，可忽略）。

---

## 第 2 步：确认环境变量

1. 项目 → **Settings → Environment Variables**
2. 确认存在 **`BLOB_READ_WRITE_TOKEN`**
3. Environment 应包含 **Production**（建议 Preview 也勾上）

若没有，在 Storage 页面点你的 Blob store → **Connect Project** 重新关联。

---

## 第 3 步：重新部署

环境变量新增后必须重新部署才生效：

```powershell
cd C:\Users\sus\ErikasChineseLearning
$env:VERCEL_TOKEN="你的token"
npx vercel --prod --token $env:VERCEL_TOKEN
```

或在 Vercel → **Deployments** → 最新部署 → **Redeploy**。

---

## 第 4 步：测试

1. 用 **lin** 登录 → **Homework** → 布置一条作业（例如「读一句 我很想你」）
2. 用 **erika** 登录 → **Homework** → 点 **Record voice** → 录音 → **Submit**
3. 再用 **lin** 打开 **Admin → Homework**，应能播放录音

上传成功时，浏览器网络请求 `/api/upload-audio` 的响应里会有：

```json
{ "url": "https://....public.blob.vercel-storage.com/...", "storage": "blob" }
```

若是 `"storage": "inline"`，说明 Blob 还没生效，检查 token 和是否重新部署。

---

## 本地开发（可选）

若想在本地也走 Blob：

1. Vercel → Storage → 你的 Blob → **.env.local** 复制 `BLOB_READ_WRITE_TOKEN`
2. 粘贴到本地 `.env`：

```env
BLOB_READ_WRITE_TOKEN="vercel_blob_..."
```

3. 重启 `npm run dev`

本地没配 token 时仍会用 inline 方式（存 data URL），方便开发。

---

## 费用

私人站点、短录音（<2MB）用量很小，Vercel Blob 免费额度通常足够。可在 Vercel **Storage** 面板查看用量。
