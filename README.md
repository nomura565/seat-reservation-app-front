# オフィスの座席予約システム
reactオンリーで構築したオフィスの座席予約システム。

## 使い方

```sh
$ npm install
$ npm start


サーバ起動 : http://localhost:4000/
port変更は.envを変更。

```

## 構造

ディレクトリ構成は以下のとおり。

```
seat-reservation-app-front/
├ README.md                    説明ファイル
├ package.json                 利用する npm パッケージなどの情報
├ public/                      公開フォルダ
│ │ ├ occupy.png               座席使用中アイコン
│ │ ├ occupy.png               座席空席アイコン
│ │ ├ office.png               オフィス背景画像
├ src/                         ソースフォルダ
│ │ ├ components               座席使用中アイコン
│ │ │ ├ Const.js               定数
│ │ │ ├ Leaflet.js             Leaflet
│ │ │ ├ LeafletMarker.js       LeafletMarker（座席オブジェクト）
│ │ │ ├ App.css                基本CSS
│ │ │ ├ App.js                 エントリポイント
│ │ │ ├ index.css              追加CSS
```
