import { MemberProfile, DanceVideo, DiaryEntry, FortuneResult } from './types';

export const MEMBERS: MemberProfile[] = [
  {
    id: 'smile',
    name: 'Smile',
    jpName: 'すまいる',
    color: '#FF9E00', // Bright Orange
    subColor: '#FFD000', // Lively Yellow
    signature: '🌻すまいるハッピー！🌻',
    tagline: 'いつもいつでも満開スマイル！あろはーずの元気印＆ハイテンション担当。',
    birthday: '8月21日（ひまわりの日！）',
    bloodType: 'O型（めちゃマイペース）',
    likes: ['グミ（ハード系）', 'ひまわり畑', 'アクロバティックなダンス', '炭酸ジュース', 'ガチャガチャ'],
    dislikes: ['静かすぎる場所', 'おばけ屋敷（全力ダッシュ気絶）', 'ピーマン'],
    message: 'みんなー！あろはーずのHPに遊びに来てくれてありがとおぉ！🧡 今日もいっしょにステップ踏んでハッピーになっちゃおうね！たくさんクリックしていってね！✨',
    stickerStyle: 'bg-amber-100 border-amber-400 rotate-[-2deg]'
  },
  {
    id: 'caramel',
    name: 'Caramel',
    jpName: 'きゃらめる',
    color: '#FF6B8B', // Pastel Pink
    subColor: '#FFA5A5', // Light Cream Pink
    signature: '🧸甘〜い時間をいっしょに。🧸',
    tagline: 'おっとりふわふわ、でもダンスは超キレキレ！あろはーずの癒やし・あざと担当。',
    birthday: '11月12日（おやつの時間🎂）',
    bloodType: 'A型（自称・几帳面）',
    likes: ['キャラメルラテ', '平成レトロな雑貨収集', 'フリルがいっぱいのお洋服', '寝落ちすること', 'クリームソーダ'],
    dislikes: ['早起き（10回アラーム必要）', '激辛キムチ', '湿気（前髪が命！）'],
    message: 'ひらひら揺れるリボンがめじるし、きゃらめるです…🎀。あろはーずのゆる〜い秘密基地へようこそ。たくさんマイナスイオン吸い込んで、ゆっくりしていってね。日記も毎日かいてるよ…！💕',
    stickerStyle: 'bg-rose-100 border-rose-400 rotate-[3deg]'
  }
];

export const DANCE_VIDEOS: DanceVideo[] = [
  {
    id: 'video-1',
    title: '【あろはーず】ハッピーシンセサイザ 踊ってみた【オリジナル衣装】',
    originalSong: 'ハッピーシンセサイザ / EasyPop',
    youtubeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder or playable simulation
    thumbnailUrl: 'https://picsum.photos/seed/dance1/480/360',
    releasedDate: '2026/04/01',
    smileComment: 'すまいる：あろはーず結成1周年記念動画！衣装は2人で生地から選んだんだよ〜！🎀',
    caramelComment: 'きゃらめる：私のツインテールが激しすぎてお互い何度も顔に当たりました…（笑）',
    heartsCount: 7820
  },
  {
    id: 'video-2',
    title: '【お外で！】おねがいダーリン 踊ってみた【すまいる×きゃらめる】',
    originalSong: 'おねがいダーリン / ONE',
    youtubeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: 'https://picsum.photos/seed/dance2/480/360',
    releasedDate: '2026/05/10',
    smileComment: 'すまいる：サビの「ちゅっ！」ってところでカメラをドアップにしてもらったのがこだわり！',
    caramelComment: 'きゃらめる：すまいるのウィンクがまぶしすぎて心臓が止まるかと思いました。',
    heartsCount: 12430
  },
  {
    id: 'video-3',
    title: '【あろはーず】ファンサ 踊ってみた【10万再生ありがとう!!】',
    originalSong: 'ファンサ / HoneyWorks',
    youtubeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: 'https://picsum.photos/seed/dance3/480/360',
    releasedDate: '2026/05/20',
    smileComment: 'すまいる：みんなへの愛が爆発しすぎて、ジャンプ力がいつもより３割増しです！🚀',
    caramelComment: 'きゃらめる：ファン第一ですっ！最後のラブレターを投げるところ、受け取ってね？🌸',
    heartsCount: 19800
  }
];

export const INITIAL_DIARY: DiaryEntry[] = [
  {
    id: 'diary-1',
    date: '2026/05/24',
    author: 'smile',
    title: '今日から新コーナー！交換日記はじめるよ！✨',
    content: 'みんなあろはーず！すまいるだよ！今日からこのHPで『交換日記コーナー』をスタートすることになりましたー！パチパチパチ👏 SNSだと言いきれない2人の日常とか、最近買った変なおもちゃの話とか（笑）、ゆるーく届けていきます！きゃらめる、ちゃんと毎日書いてね〜〜〜！！約束！！',
    response: 'きゃらめる：約束の指切り、すでに3回くらいしてる気がする…（がんばります！🥺）',
    stickers: ['🌞', '🔥', '🍊']
  },
  {
    id: 'diary-2',
    date: '2026/05/25',
    author: 'caramel',
    title: '今日のご褒美はイチゴのタルト🍓',
    content: 'すまいるに呼び出されて、今日のハードなスタジオレッスンのあとに、駅前のレトロな喫茶店に行ってきました。そこのイチゴタルト、生クリームがもこもこで夢みたいな味だったよぉ…🧸 すまいるは相変わらずクリームソーダを３秒くらいで飲み干しててびっくりした。明日は早起きだけど頑張る。',
    response: 'すまいる：３秒じゃないよ！５秒はかかったもん！🥤 てかイチゴ一口奪ってごめんね！てへ！',
    stickers: ['🍓', '🍰', '🧸']
  }
];

export const FORTUNES: FortuneResult[] = [
  {
    title: 'あろはーず全力超大吉！！',
    description: '今日は星がピカピカ！何をやってもあろはーずが全力で応援しているような、スーパーミラクルな１日になるよ！運気が宇宙を越えて大気圏突入！',
    luckLevel: '超大吉',
    commentSmile: '「もう最強！お菓子食べ放題、ガチャガチャ全種コンプできちゃうかも！？」',
    commentCaramel: '「きゃらめるも、お布団の中からお祈りしてるね…むにゃむにゃ…」',
    luckyItem: 'オレンジ味のハードグミキャンディ',
    luckyDance: '「ファンサ」のサビラストの全力手をふるところ！',
    ratingSmile: 5,
    ratingCaramel: 5
  },
  {
    title: '笑顔まんてん！すまいる大吉🌻',
    description: 'すまいるのパワーがあなたにシンクロ！憂鬱な雨雲も、あなたの笑顔で一気にキャンディポップ色の青空になっちゃうよ！',
    luckLevel: '大吉',
    commentSmile: '「やったね！いつでも隣に私がついてるから、ニコニコでいこうッ！🌻」',
    commentCaramel: '「すまいるのテンションに負けず、のんびりいきましょ〜」',
    luckyItem: '黄色いハンカチ、またはお花のステッカー',
    luckyDance: '「ハッピーシンセサイザ」のイントロのクラップ！',
    ratingSmile: 5,
    ratingCaramel: 3
  },
  {
    title: '甘口あざと！きゃらめる激吉🧸',
    description: 'きゃらめるのあざとパワーが炸裂。いつもは恥ずかしいセリフも、今日なら言えちゃうかも？周囲の人がみんなあなたに甘々になります。',
    luckLevel: '激吉',
    commentSmile: '「きゃらめるが激吉なんてズルい！あざとビーム分けて〜〜！」',
    commentCaramel: '「ふふ、今日は周りのみんなにワガママを３つまで言っていいよ〜？🎀」',
    luckyItem: 'キャラメルラテ（ホイップマシマシで！）',
    luckyDance: '「おねがいダーリン」の首かしげポーズ( *´艸｀)',
    ratingSmile: 3,
    ratingCaramel: 5
  },
  {
    title: 'お昼寝推奨！ぽかぽか中吉☀️',
    description: '焦らず急がず、マイペースが一番な日。あま〜いお茶を飲んで、風の音を聞きながら15分だけお昼寝するのが吉。エネルギー充電完了！',
    luckLevel: '中吉',
    commentSmile: '「レッスンさぼっちゃダメだよ！…えっ、アイスくれるなら一緒に寝る！」',
    commentCaramel: '「お昼寝は世界を救うライフハック…いっしょに寝よ…💤」',
    luckyItem: 'レトロな喫茶店の固めプリン',
    luckyDance: 'うとうと揺れるマイペースなダンス',
    ratingSmile: 4,
    ratingCaramel: 4
  },
  {
    title: 'のびのび踊ろう！ダンシング吉🕺',
    description: '足元がスキップしたがっているよ！日常の階段や横断歩道で、ちょっぴりリズムを取りながら歩くと、素敵なアイディアがひらめくかも。',
    luckLevel: '吉',
    commentSmile: '「いいね〜！ターンを１回するごとにハッピーメーターが10溜まるよ！」',
    commentCaramel: '「転ばないように、可愛いスニーカーを履いてお出かけしてね？」',
    luckyItem: '厚底スニーカー、あるいはカラフルな靴下',
    luckyDance: 'スキップしながら「金曜日のおはよう」',
    ratingSmile: 4,
    ratingCaramel: 3
  },
  {
    title: 'あろはーずまったり大吉🍵',
    description: '失敗しちゃっても大丈夫！あろはーずが「どんまい！」と美味しいキャンディを口に放り込んでくれるよ。あたたかい世界が包んでくれます。',
    luckLevel: 'あろはーず吉',
    commentSmile: '「転んだら起き上がればよし！私がハグしてあげるーー！！😆」',
    commentCaramel: '「ゆっくり休むのも、明日のステップのためのたいせつな準備だからね」',
    luckyItem: 'あたたかい麦茶とキャンディ',
    luckyDance: '肩の力をぬいて、ゆらゆらするダンス',
    ratingSmile: 4,
    ratingCaramel: 5
  }
];

export const GALLERY_PHOTOS = [
  { id: 'p1', title: '結成日のワンショット', url: 'https://picsum.photos/seed/photo1/500/500', rotation: -4, date: '2025.04.01' },
  { id: 'p2', title: 'スタジオ練習でボロボロ（笑）', url: 'https://picsum.photos/seed/photo2/500/500', rotation: 3, date: '2025.05.15' },
  { id: 'p3', title: 'ひまわり畑でのロケ撮影！🌻', url: 'https://picsum.photos/seed/photo3/500/500', rotation: -2, date: '2025.08.21' },
  { id: 'p4', title: 'お気に入りキャラメルパフェ！🍧', url: 'https://picsum.photos/seed/photo4/500/500', rotation: 5, date: '2025.11.12' },
  { id: 'p5', title: 'ステージ裏のドタバタ２人組', url: 'https://picsum.photos/seed/photo5/500/500', rotation: -5, date: '2026/02/14' },
  { id: 'p6', title: '帰り道の夕焼けポーズ！✨', url: 'https://picsum.photos/seed/photo6/500/500', rotation: 2, date: '2026/05/18' }
];
