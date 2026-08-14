import { React } from "@vendetta/metro/common";
import { after, before } from "@vendetta/patcher";
import { ErrorBoundary, Forms } from "@vendetta/ui/components";
import { findByProps } from "@vendetta/metro";
import StealButtons, { StickerNode } from "../ui/components/StealButtons";
import { LazyActionSheet, ActionSheetComponent } from "../modules";

const FormDivider = Forms?.FormDivider;

export function findSticker(x: any, depth = 0, seen = new Set()): StickerNode | null {
    if (!x || typeof x !== "object" || seen.has(x) || depth > 4) return null;
    seen.add(x);

    // Direct stickerNode structure
    const node = x.stickerNode ?? x;
    if (node && typeof node === "object") {
        const id = node.stickerId ?? node.sticker_id ?? node.sticker?.id ?? node.id;
        const src = node.src ?? node.url ?? node.sticker?.src ?? node.sticker?.url;
        const name = node.name ?? node.alt ?? node.sticker?.name ?? "sticker";
        const formatType = node.format_type ?? node.formatType ?? node.sticker?.format_type ?? node.sticker?.formatType ?? 1;

        if (src && typeof src === "string") {
            return { id, name, src, format_type: formatType };
        }

        if (id && typeof id === "string") {
            const ext = formatType === 4 ? "gif" : "png";
            const constructedUrl = `https://cdn.discordapp.com/stickers/${id}.${ext}`;
            return { id, name, src: constructedUrl, format_type: formatType };
        }
    }

    if (Array.isArray(x)) {
        for (const item of x) {
            const found = findSticker(item, depth + 1, seen);
            if (found) return found;
        }
        return null;
    }

    for (const key of Object.keys(x)) {
        if (key === "_owner" || key === "_store" || key === "react" || key === "children") continue;
        try {
            const found = findSticker(x[key], depth + 1, seen);
            if (found) return found;
        } catch {}
    }

    return null;
}

export function injectButtons(res: any, stickerNode: StickerNode): boolean {
    if (!res || typeof res !== "object") return false;

    let targetArray: any[] | null = null;

    if (Array.isArray(res.props?.children)) {
        targetArray = res.props.children;
    } else if (res.props?.children?.props && Array.isArray(res.props.children.props.children)) {
        targetArray = res.props.children.props.children;
    } else if (res.props?.children?.props?.children?.props && Array.isArray(res.props.children.props.children.props.children)) {
        targetArray = res.props.children.props.children.props.children;
    }

    if (!targetArray) return false;

    // Check if StealButtons already injected
    const alreadyInjected = targetArray.some((child: any) => {
        return (
            child?.type?.name === "StealButtons" ||
            child?.props?.children?.type?.name === "StealButtons" ||
            child?.key === "steal-sticker-buttons"
        );
    });

    if (alreadyInjected) return true;

    const elementsToInject: any[] = [];
    if (FormDivider) {
        elementsToInject.push(React.createElement(FormDivider, { key: "steal-divider", style: { marginLeft: 0, marginTop: 16, marginBottom: 8 } }));
    }
    elementsToInject.push(React.createElement(StealButtons, { key: "steal-buttons-inner", stickerNode }));

    targetArray.push(
        React.createElement(
            ErrorBoundary,
            { key: "steal-sticker-buttons" },
            ...elementsToInject
        )
    );

    return true;
}

export default function patchMessageStickerActionSheet() {
    const patches: (() => void)[] = [];

    try {
        // Strategy 1: Patch LazyActionSheet.openLazy
        if (LazyActionSheet?.openLazy) {
            const unpatchLazy = before("openLazy", LazyActionSheet, ([lazySheet, name, props]: any[]) => {
                try {
                    const isStickerSheet = typeof name === "string" && (name.toLowerCase().includes("sticker"));
                    const stickerFromProps = findSticker(props);

                    if (!isStickerSheet && !stickerFromProps) return;

                    if (lazySheet && typeof lazySheet.then === "function") {
                        lazySheet.then((module: any) => {
                            if (!module) return;
                            const targetMethod = module.default ? "default" : module.render ? "render" : null;
                            if (!targetMethod) return;

                            patches.push(
                                after(targetMethod, module, ([args]: any[], res: any) => {
                                    try {
                                        const node = findSticker(args) ?? stickerFromProps ?? findSticker(res);
                                        if (node) {
                                            injectButtons(res, node);
                                        }
                                    } catch {}
                                })
                            );
                        }).catch(() => {});
                    }
                } catch {}
            });
            patches.push(unpatchLazy);
        }
    } catch {}

    try {
        // Strategy 2: Patch direct GuildDetails / MessageStickerActionSheet module if present
        const directModule = findByProps("GuildDetails");
        if (directModule) {
            patches.push(
                after("default", directModule, ([args]: any[], res: any) => {
                    try {
                        const node = findSticker(args) ?? findSticker(res);
                        if (node) {
                            injectButtons(res, node);
                        }
                    } catch {}
                })
            );
        }
    } catch {}

    try {
        // Strategy 3: Patch global ActionSheet Component as fallback
        if (ActionSheetComponent) {
            const target = ActionSheetComponent.render ? ActionSheetComponent : ActionSheetComponent;
            const method = ActionSheetComponent.render ? "render" : "default";
            if (target && typeof target[method] === "function") {
                patches.push(
                    after(method, target, ([props]: any[], res: any) => {
                        try {
                            const node = findSticker(props) ?? findSticker(res);
                            if (node) {
                                injectButtons(res, node);
                            }
                        } catch {}
                    })
                );
            }
        }
    } catch {}

    return () => {
        patches.forEach((unpatch) => {
            try {
                unpatch?.();
            } catch {}
        });
    };
}
