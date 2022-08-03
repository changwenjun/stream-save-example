/* global self ReadableStream Response */

self.addEventListener('install', () => {
	self.skipWaiting()
})

self.addEventListener('activate', event => {
	event.waitUntil(self.clients.claim())
})

const map = new Map()
self.onmessage = async event => {
	let {type,data} = event.data
	if(!type)return;
	//创建
	if(type==='create'){
		console.log(data,'data')
		const filename = encodeURIComponent(data.filename.replace(/\//g, ':'))
			.replace(/['()]/g, escape)
			.replace(/\*/g, '%2A')

		const downloadUrl = self.registration.scope + Math.random() + '/' + filename
		const port2 = event.ports[0]
		const { readable, writable } = new TransformStream()
		map.set(downloadUrl, [readable, filename])
		map.set('writableObj', [writable.getWriter(), port2])
		port2.postMessage({ type,data: {downloadUrl} })
	}

	//传输
	if(type==='transport'){
		const [writableStream,port2] = map.get('writableObj');
		await writableStream.write(data.value)
		port2.postMessage({ type })
	}


	//关闭
	if(type==='end'){
		const [writableStream,port2] = map.get('writableObj');
		await writableStream.close()
		port2.postMessage({ type })
		map.delete('writableObj');
	}
}

self.onfetch = event => {
	const url = event.request.url
	const data = map.get(url)
	if (!data) return null
	map.delete(url)
	console.log('拦截到请求，构建响应')
	const [stream, filename] = data
	// Make filename RFC5987 compatible
	const fileName = filename.replace(/['()]/g, escape).replace(/\*/g, '%2A')
	const responseHeaders = new Headers({
		'Content-Type': 'application/octet-stream; charset=utf-8',
		'Transfer-Encoding': 'chunked',
		'response-content-disposition': 'attachment',
		'Content-Disposition': "attachment; filename*=UTF-8''" + fileName
	})

	event.respondWith(new Response(stream, { headers: responseHeaders }))
}
