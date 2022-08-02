import {Zip, ZipDeflate} from "fflate";

const register = async () => {
    // 已注册
    const registed = await navigator.serviceWorker.getRegistration("./");
    if (registed?.active) return registed.active;
    const swRegistration = await navigator.serviceWorker.register('sw.js', {
        scope: "./",
    });
    const sw = swRegistration.installing || swRegistration.waiting;
    let listen;
    return new Promise((resolve) => {
        sw.addEventListener(
            "statechange",
            (listen = () => {
                if (sw.state === "activated") {
                    sw.removeEventListener("statechange", listen);
                    resolve(swRegistration.active);
                }
            })
        );
    });
}


// 创建下载流
export const createDownloadStream = async (filename) => {
    const {port1, port2} = new MessageChannel();
    const sw = await register();
    const callbacks = {}
    sw.postMessage({
        type: 'create',
        data: {
            filename
        }
    }, [port2]);
    return new Promise((r) => {
        port1.onmessage = (e) => {
            const {type, data} = e.data
            if (type === 'create') {
                console.log('发起请求')
                const iframe = document.createElement("iframe");
                iframe.hidden = true;
                iframe.src = data.downloadUrl;
                iframe.name = "iframe";
                document.body.appendChild(iframe);
                r({
                    write: (value) => {
                        sw.postMessage({type: 'transport', data: {value}})
                        return new Promise(resolve => callbacks['transport'] = resolve)
                    },
                    close: () => {
                        sw.postMessage({type: 'end'})
                        return new Promise(resolve => callbacks['end'] = resolve)
                    }
                })
            }
            (type === 'transport' || type === 'end') && callbacks[type]()
        };
    });
}


export class FflateZip {
    constructor(options) {
        this.zip = null
        this.stream = options.stream
    }

    add({filename, opt = {level: 1}, uint8Array, done}, cb) {
        if (!this.zip) {
            this.zip = new Zip((err, data, final) => {
                if (err || final) {
                    return this.stream.close();
                }
                const chunks = this.concatUnit8Array([data])
                this.stream.write(chunks).then(cb)
            })
        }
        if(!this.zipStream){
            const zipStream = new ZipDeflate(filename, opt);
            this.zip.add(zipStream);
            this.zipStream = zipStream
        }
        this.zipStream.push(uint8Array, done)
    }

    concatUnit8Array(chunks) {
        const len = chunks.reduce((len, {length}) => len + length, 0);
        const mergeArr = new Uint8Array(len);
        chunks.reduce((offset, chunk) => {
            mergeArr.set(chunk, offset);
            return offset + chunk.length;
        }, 0);
        return mergeArr
    }
}