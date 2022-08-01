import {Zip,ZipDeflate} from "fflate";

const register = async ()=> {
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
export const createDownloadStream = async (filename)=> {
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


const concatUnit8Array = (chunks) => {
    const len = chunks.reduce((len, { length }) => len + length, 0);
    const mergeArr = new Uint8Array(len);
    chunks.reduce((offset, chunk) => {
        mergeArr.set(chunk, offset);
        return offset + chunk.length;
    }, 0);
    return mergeArr
};


// 缓存一此宏任务中的数据
const bufferMacroTaskChunk = (cb) => {
    const chunks = [];
    let flag = false;
    return (chunk) => {
        chunks.push(chunk);
        if (!flag) {
            flag = true;
            setTimeout(() => {
                console.log("bufferMacroTask run");
                flag = false;
                const mergeArr = concatUnit8Array(chunks)
                chunks.length = 0;
                cb(mergeArr);
            });
        }
    };
};




/*
const stream = (await createDownloadStream("LocalFileZip.zip"));

const buffer = bufferMacroTaskChunk((chunk) => {
  stream.write(chunk).then(() => {
    iterator.next();
  });
});


const zip = new fflate.Zip((err, data, final) => {
    if (err || final) {
        stream.close();
    } else {
       buffer(data)
    }
});

const zipStream = new fflate.ZipDeflate(file.name, {
    level: 5,
});

zipStream.push(value, done);


zip.add(zipStream);
zip.end();

*/




export class FflateZip{
    constructor(options) {
        this.chunks = [];
        this.zip = null
        this.stream = options.stream
        this.zipDeflateFile = {}
        this.promiseObject = {}

    }

    add({filename,opt = {level:1},uint8Array,done}){
        return new Promise((resolve,reject)=>{
            this.promiseObject[filename] = resolve
            if(!this.zip){
                const buffer = bufferMacroTaskChunk((chunk) => {
                    this.stream.write(chunk).then(() => {
                        this.promiseObject[filename]()
                    });
                });
                this.zip = new Zip((err, data, final)=>{
                    console.log(err,final,'final')
                    if (err || final) {
                        this.stream.close();
                    } else {
                        /*this.chunks = [data,...this.chunks]
                        const value = this.concatUnit8Array(this.chunks);
                        this.stream.write(value).then(()=>this.promiseObject[filename]())*/

                        buffer(data)
                    }
                })

            }

            if(!this.zipDeflateFile[filename]){
                const zipStream = new ZipDeflate(filename,opt);
                this.zip.add(zipStream);
                this.zipDeflateFile[filename] = zipStream

            }
            this.zipDeflateFile[filename].push(uint8Array, done)
        })
    }

    concatUnit8Array(chunks){
        const len = chunks.reduce((len, { length }) => len + length, 0);
        const mergeArr = new Uint8Array(len);
        chunks.reduce((offset, chunk) => {
            mergeArr.set(chunk, offset);
            return offset + chunk.length;
        }, 0);
        return mergeArr
    }
}