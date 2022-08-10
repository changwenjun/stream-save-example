import {createDownloadStream, FlatZip} from "./common";
import {MessageInfo} from "../../types";

let flateZip: FlatZip;
let port: MessagePort;
const portMessage = async (e: { data: MessageInfo }) => {
    const {type = 'iframe', pathFilename, done, zipOption, uint8Array, saveFilename} = e.data
    /**
     * type:类型
     * pathFilename：路径文件名
     * done：是否最后一个文件
     * zipOption：压缩配置
     * uint8Array：文件流
     * saveFilename：保存文件名(1.zip)
     * @type {string}
     */
    let msg = '';
    try {
        if (type) {
            if (type === 'createTransportStream' && !flateZip) {
                const streamServiceWorker = await createDownloadStream(saveFilename)
                flateZip = new FlatZip({streamServiceWorker})
            }

            if (type === 'transportStream') {
                flateZip.add({
                    uint8Array,
                    done,
                    filename: pathFilename,
                    opt: zipOption
                });
            }

            if (type === 'transportEnd') {
                flateZip.close()
                port.close()
            }
        }
    } catch (e: any) {
        msg = e.message
    }
    port.postMessage({type, msg})
}


const onMessage = async (e: { data: string, ports: Array<MessagePort> } | any): Promise<void> => {
    const {data, ports} = e;
    if (data === 'port') {
        port = ports[0]
        port.onmessage = portMessage
    }

}
window.addEventListener('message', onMessage);