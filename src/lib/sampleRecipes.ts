import { prisma } from '@/lib/prisma';

export interface SampleRecipeData {
  title: string;
  description: string;
  cookTimeMin: number;
  servings: number;
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
  categoryName: string;
  tagName: string;
  tips: string;
  storageInfo: string;
  ingredients: Array<{ name: string; amount: string; unit: string }>;
  steps: Array<{ stepNumber: number; description: string }>;
}

export const SAMPLE_RECIPES: SampleRecipeData[] = [
  {
    title: 'ふんわり卵のとろとろオムライス',
    description: '基本のチキンライスに、半熟とろとろの卵をのせる絶品オムライス。初心者でも失敗しない火加減のコツ付き！',
    cookTimeMin: 15,
    servings: 2,
    difficulty: 'EASY',
    categoryName: '主食',
    tagName: '時短',
    tips: 'フライパンをしっかり温め、バターが溶けたら卵液を一気に入れて大きく円を描くように手早くかき混ぜます。半熟の状態で火を止めると余熱でベストな食感に！',
    storageInfo: 'チキンライスは冷凍で約2週間保存可能。卵は出来立てを食べるのが一番美味しいので、食べる直前に焼くのがおすすめです。',
    ingredients: [
      { name: '卵', amount: '4', unit: '個' },
      { name: 'ごはん', amount: '300', unit: 'g' },
      { name: '鶏もも肉', amount: '100', unit: 'g' },
      { name: '玉ねぎ', amount: '1/2', unit: '個' },
      { name: 'ケチャップ', amount: '4', unit: '大さじ' },
      { name: 'バター', amount: '15', unit: 'g' },
      { name: '牛乳', amount: '2', unit: '大さじ' },
      { name: '塩・こしょう', amount: '', unit: '少々' },
    ],
    steps: [
      { stepNumber: 1, description: '鶏もも肉は1cm角に、玉ねぎはみじん切りにします。' },
      { stepNumber: 2, description: 'フライパンにバター半量を熱し、鶏肉と玉ねぎを炒め、火が通ったらごはん、ケチャップ、塩こしょうを加えて手早く炒め合わせ、お皿に盛ります。' },
      { stepNumber: 3, description: 'ボウルに卵、牛乳、塩ひとつまみをよく混ぜ合わせます。' },
      { stepNumber: 4, description: '強めの中火で残りのバターを熱し、卵液を流し入れて半熟状に手早く混ぜ、チキンライスの上にふわっとのせて完成！' },
    ],
  },
  {
    title: '豚バラとキャベツのうま塩炒め',
    description: 'ごま油とにんにくの香りが食欲をそそる！フライパン1つで10分で完成する忙しい日の定番おかず。',
    cookTimeMin: 10,
    servings: 2,
    difficulty: 'EASY',
    categoryName: '主菜',
    tagName: '節約',
    tips: 'キャベツは手でちぎるか大きめのざく切りにすると味が絡みやすく、強火で一気に炒めることでシャキシャキの歯ごたえが残ります。',
    storageInfo: '粗熱を取って清潔な密閉容器に入れ、冷蔵保存で約2〜3日。温め直す時はフライパンでさっと炒め直すかレンジでどうぞ。',
    ingredients: [
      { name: '豚バラ薄切り肉', amount: '200', unit: 'g' },
      { name: 'キャベツ', amount: '1/4', unit: '個' },
      { name: 'ごま油', amount: '1', unit: '大さじ' },
      { name: '鶏がらスープの素', amount: '1', unit: '小さじ' },
      { name: 'にんにく（すりおろし）', amount: '1', unit: '片' },
      { name: '粗挽き黒こしょう', amount: '', unit: '少々' },
    ],
    steps: [
      { stepNumber: 1, description: '豚バラ肉はひと口大に切り、キャベツはざく切りにします。' },
      { stepNumber: 2, description: 'フライパンにごま油とにんにくを弱火で熱し、香りが立ったら豚肉を加えて中火で色が変わるまで炒めます。' },
      { stepNumber: 3, description: 'キャベツを加え、強火でさっと炒め合わせます。' },
      { stepNumber: 4, description: '鶏がらスープの素と黒こしょうを回し入れ、全体に味がなじんだら火を止めて完成！' },
    ],
  },
  {
    title: 'ほっこり定番肉じゃが',
    description: 'お肉の旨みと玉ねぎの甘みがホクホクじゃがいもにじゅわっと染み込む、家庭の優しい定番の味。',
    cookTimeMin: 25,
    servings: 3,
    difficulty: 'NORMAL',
    categoryName: '主菜',
    tagName: '定番',
    tips: '煮汁が煮立ったら落とし蓋（アルミホイルで代用可）をして弱中火で煮ることで、具材全体に味がムラなく均一に染み渡ります。一度冷ますとさらに美味しくなります。',
    storageInfo: '粗熱を取って冷蔵庫で3日ほど保存可能。じゃがいもは冷凍すると食感が変わるので、冷蔵保存がおすすめです。',
    ingredients: [
      { name: '牛こま切れ肉（または豚肉）', amount: '180', unit: 'g' },
      { name: 'じゃがいも', amount: '3', unit: '個' },
      { name: 'にんじん', amount: '1', unit: '本' },
      { name: '玉ねぎ', amount: '1', unit: '個' },
      { name: '白滝（しらたき）', amount: '1', unit: '袋' },
      { name: 'だし汁（または水+だしの素）', amount: '300', unit: 'ml' },
      { name: '醤油', amount: '3', unit: '大さじ' },
      { name: 'みりん', amount: '2', unit: '大さじ' },
      { name: '砂糖', amount: '2', unit: '大さじ' },
      { name: '酒', amount: '2', unit: '大さじ' },
    ],
    steps: [
      { stepNumber: 1, description: 'じゃがいもは皮をむいて4等分に切り水にさらす。にんじんは乱切り、玉ねぎはくし形切り、白滝は食べやすい長さに切って下茹でする。' },
      { stepNumber: 2, description: '鍋にサラダ油（少々）を熱し、牛肉を炒めて色が変わったら一度取り出す。' },
      { stepNumber: 3, description: '同じ鍋に野菜と白滝を入れて軽く炒め、だし汁、酒、砂糖、みりんを加えて煮立たせる。' },
      { stepNumber: 4, description: '落とし蓋をして中火で10分煮たら、醤油とお肉を戻し入れ、さらに汁気が少し残る程度まで弱火で10分煮含めて完成！' },
    ],
  },
];

/**
 * 新規ユーザーの場合、3件のサンプルレシピをDBに自動登録する
 */
export async function ensureSampleRecipes(userId: string): Promise<boolean> {
  try {
    const existingCount = await prisma.recipe.count({
      where: { createdBy: userId, deletedAt: null },
    });

    if (existingCount > 0) {
      return false; // すでにレシピがある場合は作成しない
    }

    for (const sample of SAMPLE_RECIPES) {
      // カテゴリ取得または作成
      let category = await prisma.category.findFirst({
        where: { userId, name: sample.categoryName },
      });
      if (!category) {
        category = await prisma.category.create({
          data: {
            userId,
            name: sample.categoryName,
          },
        });
      }

      // タグ取得または作成
      let tag = await prisma.tag.findFirst({
        where: { userId, name: sample.tagName },
      });
      if (!tag) {
        tag = await prisma.tag.create({
          data: {
            userId,
            name: sample.tagName,
          },
        });
      }

      // レシピ本体作成
      const recipe = await prisma.recipe.create({
        data: {
          createdBy: userId,
          title: sample.title,
          description: sample.description,
          cookTimeMin: sample.cookTimeMin,
          servings: sample.servings,
          difficulty: sample.difficulty,
          categoryId: category.id,
          tips: sample.tips,
          storageInfo: sample.storageInfo,
        },
      });

      // タグ付け
      await prisma.recipeTag.create({
        data: {
          recipeId: recipe.id,
          tagId: tag.id,
        },
      });

      // 材料作成
      for (let i = 0; i < sample.ingredients.length; i++) {
        const ing = sample.ingredients[i];
        await prisma.recipeIngredient.create({
          data: {
            recipeId: recipe.id,
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            sortOrder: i,
          },
        });
      }

      // 手順作成
      for (const step of sample.steps) {
        await prisma.recipeStep.create({
          data: {
            recipeId: recipe.id,
            stepNumber: step.stepNumber,
            description: step.description,
          },
        });
      }
    }

    return true;
  } catch (err) {
    console.error('[SampleRecipes] Failed to seed sample recipes:', err);
    return false;
  }
}

