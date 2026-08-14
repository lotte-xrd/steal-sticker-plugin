import { React } from "@vendetta/metro/common";
import { after, before } from "@vendetta/patcher";
import { ErrorBoundary, Forms } from "@vendetta/ui/components";
import { findByProps } from "@vendetta/metro";
import StealButtons from "../ui/components/StealButtons";
import { LazyActionSheet } from "../modules";

const { FormDivider } = Forms;

export default function patchMessageStickerActionSheet() {
    const patches: (() => void)[] = [];

    const direct = findByProps("GuildDetails");

    if (direct) {
        patches.push(patchSheet("default", direct));
    } else {
        const unpatchLazy = before("openLazy", LazyActionSheet, ([lazySheet, name]) => {
            if (name !== "MessageStickerActionSheet") return;

            unpatchLazy();

            lazySheet.then((module: any) => {
                patches.push(
                    after("default", module, (_args: any[], res: any) => {
                        if (!res?.type) return;
                        patches.push(patchSheet("type", res));
                    }),
                );
            }).catch(() => {});
        });

        patches.push(unpatchLazy);
    }

    return () => patches.forEach((unpatch) => unpatch?.());
}

function patchSheet(method: string, module: any, once = false) {
    const unpatch = after(method, module, ([args]: any[], res: any) => {
        const stickerNode = args?.stickerNode;
        if (!stickerNode?.src) return;

        const StickerDetails =
            res?.props?.children?.props?.children?.props?.children;
        if (!StickerDetails) return;

        const unpatchDetails = after(
            "type",
            StickerDetails,
            ([detailArgs]: any[], detailRes: any) => {
                const node = detailArgs?.stickerNode ?? stickerNode;
                if (!node?.src) return;

                const children = detailRes?.props?.children;
                if (!Array.isArray(children)) return;

                const index = children.findIndex(
                    (child: any) => child?.type?.name === "Button",
                );

                children.splice(
                    index >= 0 ? index + 1 : children.length,
                    0,
                    React.createElement(
                        ErrorBoundary,
                        null,
                        React.createElement(FormDivider, {
                            style: { marginLeft: 0, marginTop: 16 },
                        }),
                        React.createElement(StealButtons, {
                            stickerNode: node,
                        }),
                    ),
                );

                if (once) unpatchDetails?.();
            },
        );
    });

    return unpatch;
}
