/* global self ReadableStream Response */

function __inline__worker__(){
	self.addEventListener('install', () => {
		self.skipWaiting()
	})

	self.addEventListener('activate', event => {
		event.waitUntil(self.clients.claim())
	})

	const map = new Map()
	let writableStream = null;
	let writableObjCuur = null;
	self.onmessage = event => {
		const data = event.data
		if(data.type &&data.type==='stream'){
			console.log('safsdff')
			const writableObj = writableObjCuur || writableStream.getWriter();
			console.log('data.value',data.value)
			writableObj.write(data.value)
			writableObjCuur = writableObj
			return;
		}

		if(data.type &&data.type==='closestream'){
			console.log(writableObjCuur,'writableObjCuur')
			writableObjCuur.close()
			writableStream = null;
			writableObjCuur = null;
			return;
		}


		const filename = encodeURIComponent(data.filename.replace(/\//g, ':'))
			.replace(/['()]/g, escape)
			.replace(/\*/g, '%2A')

		const downloadUrl = self.registration.scope + Math.random() + '/' + filename
		const port2 = event.ports[0]

		// [stream, data]
		const { readable, writable } = new TransformStream()
		writableStream = writable
		const metadata = [readable, data]
		map.set(downloadUrl, metadata)
		// port2.postMessage({ download: downloadUrl, writable }, [writable])
		port2.postMessage({ download: downloadUrl })
		console.log('返回 url、writable',downloadUrl)
	}

	self.onfetch = event => {
		console.log('onfetchonfetchonfetchonfetch')
		const url = event.request.url

		const hijacke = map.get(url)

		if (!hijacke) return null
		map.delete(url)
		console.log('拦截到请求，构建响应')
		const [stream, data] = hijacke
		// Make filename RFC5987 compatible
		const fileName = encodeURIComponent(data.filename).replace(/['()]/g, escape).replace(/\*/g, '%2A')
		console.log(fileName,'fileNamefileNamefileName')
		const responseHeaders = new Headers({
			'Content-Type': 'application/octet-stream; charset=utf-8',
			'Transfer-Encoding': 'chunked',
			'response-content-disposition': 'attachment',
			'Content-Disposition': "attachment; filename*=UTF-8''" + fileName
		})

		event.respondWith(new Response(stream, { headers: responseHeaders }))
	}

}


export default  __inline__worker__.toString().trim().match(
	/^function\s*\w*\s*\([\w\s,]*\)\s*{([\w\W]*?)}$/
)[1];