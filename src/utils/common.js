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
        this.stream = options.stream
        this.zipStreams = {}
        this.init()
    }

    init(){
        this.zip = new Zip((err, data, final) => {
            if (err || final) {
                return this.stream.close();
            }
            this.stream.write(data)
        })
    }


    add({filename, opt = {level: 1}, uint8Array, done}) {
        if(!this.zipStreams[filename]){
            const zipStream = new ZipDeflate(filename, opt);
            this.zip.add(zipStream);
            this.zipStreams[filename] = zipStream
        }
        this.zipStreams[filename].push(uint8Array, done)
    }

    close(){
        this.zip.end()
        this.zip = null
        this.stream = null
        this.zipStreams = {}
    }
}