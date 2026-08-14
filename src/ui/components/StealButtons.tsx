import { clipboard, React, ReactNative } from "@vendetta/metro/common";
import { Button, Forms } from "@vendetta/ui/components";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import { LazyActionSheet, downloadMediaAsset } from "../../modules";

export default function StealButtons({ stickerNode }: { stickerNode: any }) {
    const url = stickerNode?.src;
    if (!url) return null;

    const name = stickerNode?.alt ?? stickerNode?.name ?? "sticker";

    const save = () => {
        downloadMediaAsset(url, url.includes(".gif") ? 1 : 0);
        LazyActionSheet.hideActionSheet();
        showToast(`Saved ${name} to Camera Roll`, getAssetIDByName("toast_image_saved"));
    };

    return React.createElement(
        React.Fragment,
        null,
        React.createElement(Button, {
            text: "Save sticker to Camera Roll",
            color: Button.Colors.BRAND,
            size: Button.Sizes.SMALL,
            onPress: save,
            style: { marginTop: 16 },
        }),
        React.createElement(Button, {
            text: "Copy sticker URL",
            color: Button.Colors.BRAND,
            size: Button.Sizes.SMALL,
            onPress: () => {
                clipboard.setString(url);
                LazyActionSheet.hideActionSheet();
                showToast(`Copied ${name}'s URL`, getAssetIDByName("ic_copy_message_link"));
            },
            style: { marginTop: 16 },
        }),
    );
}
