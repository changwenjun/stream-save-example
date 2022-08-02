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
</script>

<template>
  <button @click="inputRef?.click()">流式 文件压缩</button>
  <input ref="inputRef" multiple type="file" hidden/>
</template>
