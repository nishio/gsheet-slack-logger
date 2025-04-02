# Python版 Slack Logger

このディレクトリには、Slackの過去ログを取得してGoogle Spreadsheetに保存するPythonスクリプトが含まれています。

## 機能

1. `slack_to_json.py`: Slackからデータを抽出してJSONファイルに保存
2. `json_to_gsheet.py`: JSONファイルからGoogle Spreadsheetにデータをアップロード

この2段階のアプローチにより、Slackデータの抽出とGoogle Spreadsheetへのアップロードを分離し、中間のJSONファイルを使って実験や分析を行うことができます。

## 必要条件

- Python 3.6以上
- 必要なパッケージ（`requirements.txt`に記載）

## インストール

```bash
pip install -r requirements.txt
```

## 使用方法

### 1. Slackからデータを抽出

```bash
python slack_to_json.py --token "xoxb-your-token" --output-dir "./slack_data"
```

#### オプション

- `--token`: Slack APIトークン（必須、または`SLACK_TOKEN`環境変数で指定）
- `--output-dir`: 出力ディレクトリ（デフォルト: `./slack_data`）
- `--year`: 抽出する年（指定しない場合は現在の2ヶ月前）
- `--month`: 抽出する月（指定しない場合は現在の2ヶ月前）
- `--last-days`: 過去何日分を取得するか（指定した場合はyear, monthは無視）
- `--auto-join`: 公開チャンネルに自動的に参加する（デフォルト: True）
- `--no-auto-join`: 公開チャンネルに自動的に参加しない
- `--skip-channels`: スキップするチャンネルIDのカンマ区切りリスト

### 2. Google Spreadsheetにアップロード

```bash
python json_to_gsheet.py --client-email "your-service-account@example.iam.gserviceaccount.com" --private-key "your-private-key" --folder-id "your-folder-id" --json-dir "./slack_data"
```

#### オプション

- `--client-email`: Google Service Accountのメールアドレス（必須、または`GOOGLE_CLIENT_EMAIL`環境変数で指定）
- `--private-key`: Google Service Accountの秘密鍵（必須、または`GOOGLE_PRIVATE_KEY`環境変数で指定）
- `--folder-id`: Google Driveのフォルダーid（必須、または`GOOGLE_FOLDER_ID`環境変数で指定）
- `--json-dir`: JSONファイルのディレクトリ（デフォルト: `./slack_data`）
- `--timezone`: タイムゾーン（デフォルト: `Asia/Tokyo`）
- `--use-latest-file`: 'latest'という名前のファイルを使用する
- `--backup-with-date`: 日付付きのバックアップを作成する（`--use-latest-file`と共に使用）

## 環境変数

スクリプトは以下の環境変数を使用することもできます：

- `SLACK_TOKEN`: Slack APIトークン
- `GOOGLE_CLIENT_EMAIL`: Google Service Accountのメールアドレス
- `GOOGLE_PRIVATE_KEY`: Google Service Accountの秘密鍵
- `GOOGLE_FOLDER_ID`: Google Driveのフォルダーid

## 例

### 月次バックアップ

```bash
# 2ヶ月前のデータを抽出
python slack_to_json.py --token "$SLACK_TOKEN" --output-dir "./slack_data"

# Google Spreadsheetにアップロード
python json_to_gsheet.py --client-email "$GOOGLE_CLIENT_EMAIL" --private-key "$GOOGLE_PRIVATE_KEY" --folder-id "$GOOGLE_FOLDER_ID" --json-dir "./slack_data"
```

### 最新30日間のデータを毎日更新

```bash
# 過去30日間のデータを抽出
python slack_to_json.py --token "$SLACK_TOKEN" --output-dir "./slack_data_latest" --last-days 30

# 'latest'ファイルを更新し、日付付きバックアップも作成
python json_to_gsheet.py --client-email "$GOOGLE_CLIENT_EMAIL" --private-key "$GOOGLE_PRIVATE_KEY" --folder-id "$GOOGLE_FOLDER_ID" --json-dir "./slack_data_latest" --use-latest-file --backup-with-date
```
