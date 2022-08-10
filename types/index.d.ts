import {DeflateOptions} from "fflate";

export interface StreamServiceWorker {
    close: () => void;
    write: (value: Uint8Array) => void;
}


export interface AddOptions {
    filename: string;
    opt: DeflateOptions,
    uint8Array: Uint8Array;
    done: Boolean
}



export interface MessageInfo {
    type: string;
    pathFilename: string;
    done: Boolean
    zipOption: DeflateOptions,
    uint8Array: Uint8Array;
    saveFilename:string
}