import { find, findByProps } from "@vendetta/metro";

export const LazyActionSheet = findByProps("openLazy", "hideActionSheet") ?? findByProps("hideActionSheet");
export const ActionSheetComponent = findByProps("ActionSheet")?.ActionSheet ?? find((m: any) => m?.render?.name === "ActionSheet" || m?.name === "ActionSheet");
export const downloadMediaAsset = findByProps("downloadMediaAsset")?.downloadMediaAsset;

