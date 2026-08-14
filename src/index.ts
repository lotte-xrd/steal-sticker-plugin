import patchMessageStickerActionSheet from "./patches/MessageStickerActionSheet";

let patches: (() => void)[] = [];

export default {
    onLoad() {
        patches.push(patchMessageStickerActionSheet());
    },
    onUnload() {
        patches.forEach((unpatch) => unpatch?.());
        patches = [];
    },
};
