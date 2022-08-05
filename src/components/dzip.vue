<script setup lang="ts">
import dzip from "dzip";
const run = () =>{
  const zip = new dzip();
  const iframe = document.createElement('iframe');
  iframe.src = 'https://www.webmysql.com/service-worker/index.html'
  document.body.append(iframe)
  iframe.onload= () => {
    zip.addFile('aa.txt', '小可爱').then((zipWriter) => {
      // console.log(zipWriter,zip)
      // console.log(zip.get())
      const {port1, port2} = new MessageChannel();
      iframe.contentWindow.postMessage('port', '*', [port2]);
      port1.postMessage({
        type: 'createTransportStream',
        saveFilename: '测试.zip'
      });

      port1.onmessage = async (e) => {
        if (e.data.type === 'createTransportStream') {

          zipWriter.close(async (res) => {
            const  value = new Uint8Array(await res.arrayBuffer())
            console.log(value)
            port1.postMessage({
              type: 'transportStream',
              uint8Array:res,
            });
          })

          port1.postMessage({
            type: 'transportEnd',
          });
          port1.close()
        }
      }
    });

  }
}


</script>

<template>
  <button @click="run()">dzip文件压缩并下载</button>
</template>
