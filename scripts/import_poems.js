// 诗词数据导入脚本
// 使用：node scripts/import_poems.js

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('请配置 Supabase 环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// 示例诗词数据
const samplePoems = [
  {
    title: '静夜思',
    author: '李白',
    dynasty: '唐代',
    content: '床前明月光，疑是地上霜。\n举头望明月，低头思故乡。',
    analysis: '这首诗通过描绘月夜思乡的场景，表达了诗人深切的思乡之情。语言简练，意境深远，是李白最著名的诗作之一。',
    tags: ['思乡', '月亮', '夜晚']
  },
  {
    title: '春晓',
    author: '孟浩然',
    dynasty: '唐代',
    content: '春眠不觉晓，处处闻啼鸟。\n夜来风雨声，花落知多少。',
    analysis: '这首诗描绘了春天早晨的景色，语言清新自然，表达了诗人对春天的热爱和对时光流逝的感慨。',
    tags: ['春天', '早晨', '自然']
  },
  {
    title: '登鹳雀楼',
    author: '王之涣',
    dynasty: '唐代',
    content: '白日依山尽，黄河入海流。\n欲穷千里目，更上一层楼。',
    analysis: '这首诗通过登高望远的场景，表达了积极向上的人生态度。前两句写景，后两句抒情，情景交融。',
    tags: ['登高', '励志', '景色']
  },
  {
    title: '相思',
    author: '王维',
    dynasty: '唐代',
    content: '红豆生南国，春来发几枝。\n愿君多采撷，此物最相思。',
    analysis: '这首诗以红豆为象征，表达了深切的相思之情。语言含蓄优美，情感真挚动人。',
    tags: ['相思', '爱情', '红豆']
  },
  {
    title: '江雪',
    author: '柳宗元',
    dynasty: '唐代',
    content: '千山鸟飞绝，万径人踪灭。\n孤舟蓑笠翁，独钓寒江雪。',
    analysis: '这首诗描绘了一幅寂静的冬日江景，意境深远，表达了诗人孤高自许的情怀。',
    tags: ['冬天', '孤独', '景色']
  },
  {
    title: '望庐山瀑布',
    author: '李白',
    dynasty: '唐代',
    content: '日照香炉生紫烟，遥看瀑布挂前川。\n飞流直下三千尺，疑是银河落九天。',
    analysis: '这首诗以夸张的手法描绘了庐山瀑布的壮丽景色，展现了李白浪漫主义的诗风。',
    tags: ['瀑布', '庐山', '浪漫']
  },
  {
    title: '悯农',
    author: '李绅',
    dynasty: '唐代',
    content: '锄禾日当午，汗滴禾下土。\n谁知盘中餐，粒粒皆辛苦。',
    analysis: '这首诗表达了诗人对农民辛勤劳动的同情和对粮食的珍惜，语言朴实，意义深远。',
    tags: ['农民', '劳动', '珍惜']
  },
  {
    title: '黄鹤楼送孟浩然之广陵',
    author: '李白',
    dynasty: '唐代',
    content: '故人西辞黄鹤楼，烟花三月下扬州。\n孤帆远影碧空尽，唯见长江天际流。',
    analysis: '这首诗是送别诗中的佳作，通过景物的描写表达了诗人对友人的深厚情谊。',
    tags: ['送别', '友情', '长江']
  }
]

async function importPoems() {
  console.log('开始导入诗词数据...')
  
  for (const poem of samplePoems) {
    const { data, error } = await supabase
      .from('poems')
      .insert([poem])
      .select()
    
    if (error) {
      console.error(`导入诗词 "${poem.title}" 失败:`, error)
    } else {
      console.log(`✓ 成功导入: ${poem.title} - ${poem.author}`)
    }
    
    // 添加延迟避免速率限制
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log('诗词数据导入完成！')
}

importPoems().catch(console.error)