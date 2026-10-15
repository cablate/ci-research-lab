# CI Research Lab
[English](README.md)

這是給改善 CI 輪子的開發者使用的核心原型：同一套契約→計畫→證據→判定模型，區分已觀察失敗、證據不足與無效輸入。原有 lab 案例作比較對照；這不是已完成產品或安全邊界。

## 快速開始

本機證據使用 Windows、Node.js 22.23.2 與 npm 10.9.8。Ubuntu hosted 證據仍待驗證；workflow 指定同一個 Node 版本。

```sh
npm ci --ignore-scripts
npm run verify
npm run context
```

預期是 59 個測試通過、零失敗，最後出現以下訊息。反例只有抓到預期錯誤時才通過；外層驗證失敗代表真正問題，不是「本來就要紅」。

```text
VERIFY_PASSED: build + bilingual docs + tests
```

本機上下文回報 NOT_PR_EVENT_EVIDENCE。合成或手動執行不能代替真 PR 事件的證據。詳見[步驟與證據](docs/experiments.md)。

## 已接受範圍與設計

- 不發布至 npm 的 TypeScript 範例，把有限數字去重排序且不修改輸入；沒有 runtime dependencies 或外部 API。
- 同一個驗證入口建置、檢查雙語結構，並用 Node 原生 test runner 執行產品及 CI 政策測試。
- 隔離反例涵蓋執行結果變異、型別錯誤、吞錯、零測試、必要結果略過／缺失／取消、路徑選擇及本機／PR 上下文。
- 分類只做影子判斷：文件變更的建議不會略過真正 product job；未知輸入選擇產品檢查。
- Product 驗證與持續有機會執行的結果 gate 分開；gate 實際判斷必要結果。這不會設定 branch protection，也不證明合併被強制阻止。
- 僅標準 Ubuntu、唯讀 contents 與 SHA 固定的 actions；本輪不含 secrets、部署、付費服務、self-hosting、排程、外部 fork、OIDC 或 merge queue。

零 runtime 依賴的核心已能從嚴格版本化契約建立全必要項目的計畫，把證據綁定 revision／contract／plan digest，並以穩定原因碼解釋 pass／fail／inconclusive／invalid。GitHub gate 使用同核心；舊本機政策只留作對照，不是第二套 hosted gate。[核心 API 與 CLI](docs/core.md)說明支援子集；[貢獻指南](CONTRIBUTING.md)說明重現方式；[變更](CHANGELOG.zh-TW.md)尚未發布。

## 唯讀核心 CLI

以下 fixture 使用合成 revision，不是已認證的執行證據。前兩個命令 exit zero；最後一個 exit 2 並回報 REQUIRED_EVIDENCE_MISSING，這是預期的證據不足對照，不是 crash。判定會依契約與預期情境獨立重建計畫。CLI 只讀 JSON、輸出結果，不執行檢查。

```sh
node tools/ci.mjs plan fixtures/contract.json fixtures/context.json
node tools/ci.mjs evaluate fixtures/contract.json fixtures/context.json fixtures/plan.json fixtures/evidence-good.json
node tools/ci.mjs explain fixtures/contract.json fixtures/context.json fixtures/plan.json fixtures/evidence-missing.json
```

## 現況與下一步

本機建置與 59 個測試已通過；乾淨安裝與 workflow 靜態證據記錄在證據文件。Hosted PR 行為等待維護者驗證。下一步是有限度執行正常／產品失敗／product 略過的 PR 對照，記錄真正 run URL 與被測 revision。維護者透過本文件持有範圍、證據狀態與下一步。

## 限制、資料與移除

Runner 檢查具名基線標記、有測試檔且通過數非零，不保證找出所有缺測試或規格錯誤。Hosted 契約目前至少要求 59 個已執行通過的測試；未配置最低值會明示未驗證數量。Digest 是 fingerprint，不是簽章，也不能防止偽造報告。取消／缺失輸入目前由本機模擬；取消整個 workflow 可能連 gate 都停止。雙語檢查只涵蓋結構與程式碼，不查翻譯。不宣稱省時或省額度的比例。

安裝從公開 npm registry 下載 lockfile 固定的 TypeScript，也可能向 registry 傳送相依審計 metadata。驗證讀取本機原始碼，寫入被忽略的建置／暫存 fixture，並清理各 fixture；不傳送測試資料至應用 API。GitHub 下載工具、依平台政策保留日誌，可能消耗帳號額度。不執行命令／workflow 即可停止；刪除 checkout 可移除本機檔案。沒有安裝背景服務。

## 維護與權利

本輪不含 release／tag／npm 發布或開源授權。公開可見不代表可依 MIT 或其他授權再散布。非敏感的重現步驟可透過 [issues](https://github.com/cablate/ci-research-lab/issues) 回報；不要張貼憑證或私人資料。限制與維護流程見[貢獻指南](CONTRIBUTING.md)。
