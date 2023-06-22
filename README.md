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

## できること

- 座席日別予約
- 予約された座席の削除（空席登録）
- オフィスの切り替え
- 未来日の座席予約、閲覧
- 固定席の設定（固定席の場合、他の席情報を強制的に削除します。年月日はXXXX/XX/XXで登録されます）

## できないこと

- 時間指定の座席予約（13時～15時とかの指定はできません。日単位）
- ~~座席の追加（DBから直接変更のみ）~~　↓を追加
- http://localhost:3000/?admin=trueにアクセスすると座席位置更新モードになるのでそこから更新する
- オフィスの追加（DBから直接変更のみ）
- 期間指定の座席の削除（DBから直接変更のみ）
