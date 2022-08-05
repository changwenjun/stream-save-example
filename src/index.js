import {createDownloadStream, FflateZip} from "./utils/common";

let fflateZip = null
let port = null;

const portMessage = async (e) =>{
    const {type = 'iframe', pathFilename, done, zipOption = {level: 9}, uint8Array, saveFilename, id} = e.data
    /**
     * type:类型
     * pathFilename：路径文件名
     * done：是否最后一个文件
     * zipOption：压缩配置
     * uint8Array：文件流
     * saveFilename：保存文件名
     * id：本次通信id
     * @type {string}
     */
    let msg = '';
    try {
        if (type) {
            if (type === 'createTransportStream' && !fflateZip) {
                const downloadStream = await createDownloadStream(saveFilename)
                fflateZip = new FflateZip({stream: downloadStream})
            }

            if (type === 'transportStream') {
                fflateZip.add({
                    uint8Array,
                    done,
                    filename: pathFilename,
                    opt: zipOption
                });
            }

            if (type === 'transportEnd') {
                fflateZip.close()
                port.close()
                fflateZip = null;

            }
        }
    } catch (e) {
        msg = e.message
    }
    port.postMessage({type, id, msg})
}


const onMessage = async (e) => {
    if(e.data==='port'){
        const {ports} = e;
        port = ports[0]
        port.onmessage = portMessage
    }

}
window.addEventListener('message', onMessage);