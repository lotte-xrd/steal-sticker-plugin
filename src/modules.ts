import { find, findByProps } from "@vendetta/metro";

export const getLazyActionSheet = () =>
    findByProps("openLazy", "hideActionSheet") ?? findByProps("hideActionSheet");

export const getActionSheetComponent = () =>
    findByProps("ActionSheet")?.ActionSheet ??
    find((m: any) => m?.render?.name === "ActionSheet" || m?.name === "ActionSheet");

export const getDownloadMediaAsset = () =>
    findByProps("downloadMediaAsset")?.downloadMediaAsset;
