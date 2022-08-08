<script setup lang="ts">
import {onMounted, ref} from "@vue/runtime-core";
import {createDownloadStream, FflateZip} from "../utils/common.js";

const inputRef = ref<HTMLInputElement | null>(null);
onMounted(async () => {
  inputRef.value?.addEventListener("change", async (e: any) => {
    const files: FileList = e.target!.files;
    if (files.length === 0) return;
    const stream = (await createDownloadStream("LocalFileZip.zip"));
    const fflateZip = new FflateZip({stream})
    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      const reader = file.stream().getReader()
      while (true) {
        const {done, value = new Uint8Array()} = await reader.read();
        fflateZip.add({
          uint8Array: value,
          done,
          filename: file.name,
          opt: {level: 9}
        });
        if (done) break;
      }
    }
    fflateZip.zip.end()
  });
});
/*
onMounted(async () => {
  const iframe = document.createElement('iframe');
  iframe.src = 'https://www.webmysql.com/service-worker/index.html'
  document.body.append(iframe)
  iframe.onload= () =>{
    inputRef.value?.addEventListener("change", async (e: any) => {
      const files: FileList = e.target!.files;
      if (files.length === 0) return;
      const {port1,port2} = new MessageChannel();
      iframe.contentWindow.postMessage('port', '*', [port2]);
      port1.postMessage({
        type:'createTransportStream',
        saveFilename:'测试.zip'
      });
      port1.onmessage = async (e)=>{
        console.log(111)
        if(e.data.type==='createTransportStream'){
          console.log(111)
          for (let i = 0; i < files.length; i++) {
            const file = files.item(i);
            const reader = file.stream().getReader()
            while (true) {
              const {done, value = new Uint8Array()} = await reader.read();
              port1.postMessage({
                type:'transportStream',
                uint8Array: value,
                done,
                pathFilename:file.name
              });
              if (done) break;
            }
          }

          port1.postMessage({
            type:'transportEnd',
          });
          port1.close()
        }
      }
    })
  }
});*/
</script>

<template>
  <button @click="inputRef?.click()">流式 文件压缩</button>
  <input ref="inputRef" multiple type="file" hidden/>
</template>
