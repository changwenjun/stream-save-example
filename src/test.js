const {readable, writable} = new TransformStream()
const downloadUrl = 'https://www.webmysql.com/service-worker/0.9407976696683049/621742009399_2022-08-08__PC%E7%AB%AF%E4%B8%BB%E5%9B%BE.zip'
console.log(downloadUrl,'downloadUrl');
const map = new Map()
map.set(downloadUrl, [
    readable,
    55555,
    writable.getWriter(),
    2222
])

const [,,writable1, port2] = map.get(downloadUrl);
console.log(writable1,port2)
