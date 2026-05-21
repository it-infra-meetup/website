import ltImagePaths from './ltImagePaths'

const lts = {
  // 2025年
  '20251206': {
    title: 'トークショー',
    author: 'えー,kimkim0106,petipeti,zin3,Sumi-Sumi,冬華 蕐',
    image: ltImagePaths['20251206'],
  },
  '20251108': {
    title: '自律機械知能PAMIQの計算機環境',
    author: 'GesonAnko',
    image: ltImagePaths['20251108'],
  },
  '20251011': {
    title: 'NixOS + Kubernetesで構築する自宅サーバーのすべて',
    author: 'ichi-h',
    image: ltImagePaths['20251011'],
  },
  '20250927': {
    title: '推測困難なIDを用いた認証レスファイル共有',
    author: 'isoshigi',
    image: ltImagePaths['20250927'],
  },
  '20250719_s': {
    title: 'VPNで外からPCVRフルトラ',
    author: 'Sumi-Sumi',
    image: ltImagePaths['20250719_s'],
  },
  '20250719_z': {
    title: 'おうちに低遅延な動画配信サーバをたてる',
    author: 'zin3',
    image: ltImagePaths['20250719_z'],
  },
  '20250607': {
    title: 'オレオレ IP 電話網を大きくしたら Tailscale のワナを踏み抜いて発狂した話',
    author: 'KusaReMKN',
    image: ltImagePaths['20250607'],
  },
  '20250524': {
    title: 'VPCに属するサービスと属さないサービスはどう違うのだろうか？',
    author: 'Koty-Mousa',
    image: ltImagePaths['20250524'],
  },
  '20250510': {
    title: '経路を自前で管理しとうない！',
    author: '冬華 蕐',
    image: ltImagePaths['20250510'],
  },
  '20250426': {
    title: '自宅Entra Connect・Entra Joinを始めよう',
    author: 'てるるん',
    image: ltImagePaths['20250426'],
  },
  '20250412': {
    title: '逸般化へはじめの一歩',
    author: '8yazaki',
    image: ltImagePaths['20250412'],
  },
  '20250329': {
    title: 'ﾌﾞﾗｳｻﾞﾎﾟﾁﾎﾟﾁk8s～やさしいｸﾊﾞﾈﾃRancher～',
    author: 'zin3',
    image: ltImagePaths['20250329'],
  },
  '20250315': {
    title: '超高帯域学術回線を用いたVRchatでの高臨場IP伝送',
    author: 'いり',
    image: ltImagePaths['20250315'],
  },
  '20250301': {
    title: 'Eronunotice の裏側',
    author: 'petipeti',
    image: ltImagePaths['20250301'],
  },
  '20250215': {
    title: 'なぜStatusCheckFailed_Systemが 出たら、停止して起動 すると良いのか',
    author: 'Koty-Mousa',
    image: ltImagePaths['20250215'],
  },
  '20250201': {
    title: '宇宙の天気がITインフラに与える影響とその対策 ~太陽が地球のコンピュータを破壊する？~',
    author: 'さめ（meg-ssk)',
    image: ltImagePaths['20250201'],
  },
  '20250118': {
    title: 'ミニPCを100Gbpsトラフィックジェネレータとして動かしてみた',
    author: 'c-maxwell',
    image: ltImagePaths['20250118'],
  },

  // 2024年
  '20241207': {
    title: 'ambrのAWS CDK事情',
    author: 'kairox',
    image: ltImagePaths['20241207'],
  },
  '20241123': {
    title: '鉄道におけるITインフラの活用例',
    author: 'おくう',
    image: ltImagePaths['20241123'],
  },
  '20241109': {
    title: 'EC2インスタンスにいろんな方法で接続してみよう',
    author: 'Koty-Mousa',
    image: ltImagePaths['20241109'],
  },
  '20241026': {
    title: 'LocalStackを使ってローカル環境でAWSを構築する',
    author: 'petipeti',
    image: ltImagePaths['20241026'],
  },
  '20241012': {
    title: 'おうちで始めるSAN',
    author: '冬華 蕐',
    image: ltImagePaths['20241012'],
  },
  '20240928': {
    title: '自宅k8s clusterはじめてみた',
    author: 'BOXP',
    image: ltImagePaths['20240928'],
  },
  '20240831': {
    title: 'AWS App Studioを触ってみた。',
    author: 'petipeti',
    image: ltImagePaths['20240831'],
  },
  '20240622': {
    title: '誤自宅インフラ',
    author: '冬華_蕐',
    image: ltImagePaths['20240622'],
  },
  '20240608': {
    title: 'Making Misskey․io Habitable',
    author: 'KOBA789',
    image: ltImagePaths['20240608'],
  },
  '20240525': {
    title: '52万人を支えるインフラの秘密',
    author: '村上さん',
    image: ltImagePaths['20240525'],
  },
  '20240511': {
    title: 'Proxmox8.2の自動インストールをネットワーク経由でやってみた',
    author: 'makihiro',
    image: ltImagePaths['20240511'],
  },
  '20240427': {
    title: 'うちの自宅鯖事情',
    author: 'zin3',
    image: ltImagePaths['20240427'],
  },
  '20240413': {
    title: 'Boothを支えるインフラ',
    author: 'kiridaruma',
    image: ltImagePaths['20240413'],
  },

  // 2023年
  '20231223': {
    title: '2023年ITインフラ集会振り返り',
    author: '〆／しめ',
    image: ltImagePaths["20231125_a"],
  },
  '20231125': {
    title: '今日からはじめるZabbix',
    author: 'done_san',
    image: ltImagePaths['20231125'],
  },
  '20231028': {
    title: 'デスクトップPCから始めるお家サーバーのすすめ',
    author: '涼音リン',
    image: ltImagePaths['20231028'],
  },
  '20230930': {
    title: 'network boot 入門',
    author: 'makihiro',
    image: ltImagePaths['20230930'],
  },
  '20230916': {
    title: 'ストレージサーバー作ってみた',
    author: 'えー',
    image: ltImagePaths['20230916'],
  },
  // '20230902': {
  //   title: '富士山の携帯回線について',
  //   author: '〆／しめ',
  // },
  '20230805': {
    title: 'DWDMとOTNによる超高速光伝送技術',
    author: '神楽あるか',
    image: ltImagePaths['20230805'],
  },
  '20230722': {
    title: 'IPoE環境での自宅サーバー運用(RDP)',
    author: 'AliceOtosaki',
    image: ltImagePaths['20230722'],
  },
}

export default lts
