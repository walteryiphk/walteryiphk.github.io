# 油價折扣計算器 PWA

根據加德士能源卡折扣 Excel 逆向工程而成的網頁應用（Progressive Web App）。

## 檔案
- index.html - 主頁面
- style.css - 樣式
- app.js - 計算邏輯 + 政府開放數據 API 讀取
- manifest.json - PWA 設定（可加至手機主畫面）
- sw.js - Service Worker（離線快取）
- icon.svg - App 圖示

## 計算公式（4 個輸入 → 全部結果）
輸入：牌價 P、能源卡折扣 D（負數）、每次入 V、送 Bonus B

- 實際須付 = V × (P + D) / P
- 入(ℓ) = V / P
- 送埋總得(ℓ) = (V + B) / P
- 折後真油價 = 實際須付 / 送埋總得(ℓ)
- 實際折扣 = 折後真油價 - P
- 每公里($) = 折後真油價 / (km per litre)

## 自動讀取牌價
按「自動讀取政府油價牌價」會呼叫消費者委員會「油價資訊通」開放數據 JSON：
https://www.consumer.org.hk/pricewatch/oilwatch/opendata/oilprice.json

此數據集（data.gov.hk 資料集 cc-oilprice-oilprice）每個油公司只提供單一「無鉛汽油」／「柴油」
牌價，並無區分「平油」與「貴油」（如加德士 Techron 白金／黃金汽油），所以自動讀取後兩欄
會填入同一牌價，「貴油」欄請自行按官方公佈調整加幅（通常貴油較平油貴 $1.5–2/L）。

## 使用方法
1. 用瀏覽器打開 index.html（或部署到任何靜態網頁伺服器 / GitHub Pages）。
2. 手機瀏覽器可用「加至主畫面」安裝成 App，安裝後支援離線使用（已快取的頁面／上次計算）。
3. 手動輸入或自動讀取牌價後，即時顯示實際須付、折後真油價、實際折扣及每公里油費表。

## 部署注意
- 因為政府 API 伺服器未必開放 CORS 給任意網域讀取，若自動讀取失敗，
  可自行架設一個簡單的後端 proxy（例如 Cloudflare Worker）轉發請求，
  或直接手動輸入牌價（已提供手動輸入功能作為後備）。
