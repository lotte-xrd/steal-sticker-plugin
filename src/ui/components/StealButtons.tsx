import { clipboard, React } from "@vendetta/metro/common";
import { Button } from "@vendetta/ui/components";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import { getLazyActionSheet, getDownloadMediaAsset } from "../../modules";

export interface StickerNode {
    id?: string;
    name?: string;
    alt?: string;
    src?: string;
    url?: string;
    format_type?: number;
    formatType?: number;
}

export default function StealButtons({ stickerNode }: { stickerNode: StickerNode }) {
    const url = stickerNode?.src ?? stickerNode?.url;
    if (!url) return null;

    const name = stickerNode?.name ?? stickerNode?.alt ?? "sticker";
    const formatType = stickerNode?.format_type ?? stickerNode?.formatType ?? 1;
    const isGif = formatType === 4 || url.toLowerCase().includes(".gif");

    const btnColor = Button?.Colors?.BRAND ?? Button?.Colors?.PRIMARY ?? "brand";
    const btnSize = Button?.Sizes?.SMALL ?? "small";

    const handleSave = () => {
        try {
            const downloadMediaAsset = getDownloadMediaAsset();
            const LazyActionSheet = getLazyActionSheet();

            if (typeof downloadMediaAsset === "function") {
                downloadMediaAsset(url, isGif ? 1 : 0);
                LazyActionSheet?.hideActionSheet?.();
                showToast(`Saved ${name} to Camera Roll`, getAssetIDByName("toast_image_saved"));
            } else {
                showToast("Download asset function unavailable");
            }
        } catch (e: any) {
            showToast("Failed to save sticker");
        }
    };

    const handleCopyUrl = () => {
        try {
            const LazyActionSheet = getLazyActionSheet();
            clipboard.setString(url);
            LazyActionSheet?.hideActionSheet?.();
            showToast(`Copied ${name}'s URL`, getAssetIDByName("ic_copy_message_link"));
        } catch (e: any) {
            showToast("Failed to copy sticker URL");
        }
    };

    const handleCopyImage = () => {
        try {
            const LazyActionSheet = getLazyActionSheet();
            const cb = clipboard as any;
            if (typeof cb?.setImage === "function") {
                cb.setImage(url);
                LazyActionSheet?.hideActionSheet?.();
                showToast(`Copied ${name}'s image`, getAssetIDByName("toast_image_saved"));
            } else if (typeof cb?.copyImage === "function") {
                cb.copyImage(url);
                LazyActionSheet?.hideActionSheet?.();
                showToast(`Copied ${name}'s image`, getAssetIDByName("toast_image_saved"));
            } else {
                clipboard.setString(url);
                LazyActionSheet?.hideActionSheet?.();
                showToast(`Copied ${name}'s image URL`, getAssetIDByName("ic_copy_message_link"));
            }
        } catch (e: any) {
            showToast("Failed to copy sticker image");
        }
    };

    return React.createElement(
        React.Fragment,
        null,
        React.createElement(Button, {
            text: "Copy sticker URL",
            color: btnColor,
            size: btnSize,
            onPress: handleCopyUrl,
            style: { marginTop: 12 },
        }),
        React.createElement(Button, {
            text: "Copy image to clipboard",
            color: btnColor,
            size: btnSize,
            onPress: handleCopyImage,
            style: { marginTop: 8 },
        }),
        React.createElement(Button, {
            text: "Save sticker to Camera Roll",
            color: btnColor,
            size: btnSize,
            onPress: handleSave,
            style: { marginTop: 8 },
        })
    );
}
