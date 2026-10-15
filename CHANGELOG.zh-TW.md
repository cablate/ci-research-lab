# 變更紀錄
[English](CHANGELOG.md)

這是實驗變更，不是 release。套件版號僅由 package.json 持有；沒有穩定 API 或升級承諾。

## 未發布

- 新增中性 TypeScript 範例，以及本機／CI 共用的驗證命令。
- 新增正常對照、依特定原因拒絕的反例、雙語入口文件與有限度的 hosted 步驟。
- 新增版本化驗證核心與唯讀 CLI、綁定 revision 的證據、四狀態判定，以及同核心的 GitHub gate 整合。
- 記錄已公開基線的四次有界 hosted 對照：正常 main／PR 以 59 個測試通過、產品退化判為失敗、product 略過判為證據不足；兩個負例 gate 都退出非零。這不是 release，也不證明合併被強制阻止。
