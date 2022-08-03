import {createDownloadStream, FflateZip} from "./utils/common";

let fflateZip = null
const onMessage = async (e) => {
    const {ports, data} = e;
    const port = ports[0];
    const {type = 'iframe', pathFilename, done, zipOption = {level: 9}, uint8Array, saveFilename, id} = data
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
            if (type === 'createDownloadStream' && !fflateZip) {
                const downloadStream = await createDownloadStream(saveFilename)
                fflateZip = new FflateZip({stream: downloadStream})
            }

            if (type === 'stream') {
                fflateZip.add({
                    uint8Array,
                    done,
                    filename: pathFilename,
                    opt: zipOption
                });
            }

            if (type === 'end') {
                fflateZip.zip.end()
                fflateZip = null;
            }
        }
    } catch (e) {
        msg = e.message
    }
    port.postMessage({type, id, msg})
}
window.addEventListener('message', onMessage);