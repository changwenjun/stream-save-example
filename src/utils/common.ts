import {Zip, ZipDeflate} from "fflate";
import {StreamServiceWorker,AddOptions} from '../../types/index'

const register = async () => {
    // 已注册
    const register = await navigator.serviceWorker.getRegistration("./");
    if (register?.active) return register.active;
    const swRegistration: any = await navigator.serviceWorker.register('sw.js', {
        scope: "./",
    });
    const sw: any = swRegistration.installing || swRegistration.waiting;
    let listen: any;
    return new Promise<ServiceWorker>((resolve) => {
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
export const createDownloadStream = async (filename: string): Promise<StreamServiceWorker> => {
    const {port1, port2} = new MessageChannel();
    const sw = await register();
    sw.postMessage({
        type: 'create',
        data: {
            filename
        }
    }, [port2]);
    return new Promise((resolve) => {
        port1.onmessage = (e: {
            data: {
                type: string;
                data: { downloadUrl: string }
            }
        }) => {
            const {type, data} = e.data
            if (type === 'create') {
                const iframe = document.createElement("iframe");
                iframe.hidden = true;
                iframe.src = data.downloadUrl;
                iframe.name = "iframe";
                document.body.appendChild(iframe);
                resolve({
                    write: (value: Uint8Array) => sw.postMessage({
                        type: 'transport',
                        data: {value},
                        key: data.downloadUrl
                    }),
                    close: () => sw.postMessage({type: 'end', key: data.downloadUrl})
                })
            }
        };
    });
}


export class FlatZip {
    private streamServiceWorker;
    private zipStreams: { [key: string]: any } = {};
    private zip: Zip;

    constructor(options: { streamServiceWorker: StreamServiceWorker }) {
        this.streamServiceWorker = options.streamServiceWorker
        this.zipStreams = {}
        this.zip = new Zip((err, data, final) => {
            if (err || final) {
                return this.streamServiceWorker.close();
            }
            this.streamServiceWorker.write(data)
        })
    }


    add({filename, opt = {level: 1}, uint8Array, done}: AddOptions) {
        if (!this.zipStreams[filename]) {
            const zipStream = new ZipDeflate(filename, opt);
            this.zip.add(zipStream);
            this.zipStreams[filename] = zipStream
        }
        this.zipStreams[filename].push(uint8Array, done)
    }

    close() {
        this.zip.end()
    }
}