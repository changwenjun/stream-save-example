<script setup lang="ts">
import {onMounted, ref} from "@vue/runtime-core";
import {createDownloadStream, FlatZip} from "../utils/common";

const inputRef = ref<HTMLInputElement | null>(null);

onMounted(async () => {
  inputRef.value?.addEventListener("change", async (e: any) => {
    const files: FileList = e.target!.files;
    if (files.length === 0) return;
    const streamServiceWorker = (await createDownloadStream("example.zip"));
    const flatZip = new FlatZip({streamServiceWorker})
    for (let i = 0; i < files.length; i++) {
      const file:any = files.item(i);
      const reader = file.stream().getReader()

      while (true) {
        const {done, value = new Uint8Array()} = await reader.read();
        flatZip.add({
          uint8Array: value,
          done,
          filename: file.name,
          opt: {level: 9}
        });
        if (done) break;
      }

    }

    flatZip.close()
  });
});


// 使用iframe的原因是解决浏览器插件内使用serviceWorker的问题，serviceWorker注册文件必须是同源的
/*onMounted(async () => {
  const iframe = document.createElement('iframe');
  //src是打包以后dist目录文件上传到服务器的index.html地址
  iframe.src = 'html文件地址'
  document.body.append(iframe)
  iframe.onload = () => {
    inputRef.value?.addEventListener("change", async (e: any) => {
      const files: FileList = e.target!.files;
      if (files.length === 0) return;
      const {port1, port2} = new MessageChannel();
      iframe.contentWindow.postMessage('port', '*', [port2]);
      port1.postMessage({
        type: 'createTransportStream',
        saveFilename: '测试.zip'
      });
      port1.onmessage = async (e) => {
        if (e.data.type === 'createTransportStream') {
          for (let i = 0; i < files.length; i++) {
            const file:any = files.item(i);
            const reader = file.stream().getReader()
            while (true) {
              const {done, value = new Uint8Array()} = await reader.read();
              port1.postMessage({
                type: 'transportStream',
                uint8Array: value,
                done,
                pathFilename: file.name
              });
              if (done) break;
            }
          }

          port1.postMessage({
            type: 'transportEnd',
          });
          port1.close()
        }
      }
    })
  }
});*/
</script>

<template>
  <button @click="inputRef?.click()">文件压缩流式下载</button>
  <input ref="inputRef" multiple type="file" hidden/>
</template>
