// 测试网络连接和DNS解析
const https = require('https')
const dns = require('dns')

const supabaseUrl = 'yxrpcnrcptilmqfvfatd.supabase.co'

console.log('开始网络连接诊断...')
console.log('Supabase主机:', supabaseUrl)

// 1. DNS解析测试
dns.resolve4(supabaseUrl, (err, addresses) => {
  if (err) {
    console.error('❌ DNS解析失败:', err.message)
    console.log('可能的原因：')
    console.log('1. 网络连接问题')
    console.log('2. DNS服务器配置问题')
    console.log('3. Supabase项目不存在或被删除')
  } else {
    console.log('✅ DNS解析成功')
    console.log('IP地址:', addresses)
    
    // 2. HTTPS连接测试
    console.log('\n2. 测试HTTPS连接...')
    const options = {
      hostname: supabaseUrl,
      port: 443,
      path: '/',
      method: 'GET',
      timeout: 10000
    }
    
    const req = https.request(options, (res) => {
      console.log('✅ HTTPS连接成功')
      console.log('状态码:', res.statusCode)
      console.log('响应头:', res.headers)
      
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        console.log('响应长度:', data.length, '字符')
      })
    })
    
    req.on('error', (error) => {
      console.error('❌ HTTPS连接失败:', error.message)
      if (error.code === 'ECONNREFUSED') {
        console.log('连接被拒绝，可能的原因：')
        console.log('1. Supabase项目被暂停')
        console.log('2. 防火墙阻止连接')
        console.log('3. 代理设置问题')
      } else if (error.code === 'ETIMEDOUT') {
        console.log('连接超时，可能的原因：')
        console.log('1. 网络连接问题')
        console.log('2. Supabase服务器无响应')
      }
    })
    
    req.on('timeout', () => {
      console.error('❌ 连接超时')
      req.destroy()
    })
    
    req.end()
  }
})

// 3. 代理设置检查
console.log('\n3. 检查代理设置...')
console.log('HTTP_PROXY:', process.env.HTTP_PROXY || '未设置')
console.log('HTTPS_PROXY:', process.env.HTTPS_PROXY || '未设置')
console.log('NO_PROXY:', process.env.NO_PROXY || '未设置')

// 4. 网络配置检查
console.log('\n4. 网络配置检查...')
console.log('Node.js版本:', process.version)
console.log('操作系统:', process.platform)
console.log('架构:', process.arch)