({
  onLoad() {
    const { React } = vendetta.metro.common;
    const { after, before } = vendetta.patcher;
    const { findByProps } = vendetta.metro;
    const { ErrorBoundary, Forms, Button } = vendetta.ui.components;
    const { getAssetIDByName } = vendetta.ui.assets;
    const { showToast } = vendetta.ui.toasts;
    const { clipboard } = vendetta.metro.common;

    const { FormDivider } = Forms;
    const LazyActionSheet = findByProps("hideActionSheet");
    const Media = findByProps("downloadMediaAsset");
    const downloadMediaAsset = Media?.downloadMediaAsset;

    const patches = [];

    function StealButtons({ stickerNode }) {
      const url = stickerNode?.src;

      if (!url) return null;

      const name = stickerNode?.alt ?? stickerNode?.name ?? "sticker";

      return React.createElement(
        React.Fragment,
        null,

        React.createElement(Button, {
          text: "Save sticker to Camera Roll",
          color: Button.Colors.BRAND,
          size: Button.Sizes.SMALL,
          onPress: () => {
            try {
              if (!downloadMediaAsset)
                throw new Error("downloadMediaAsset unavailable");

              downloadMediaAsset(
                url,
                url.includes(".gif") ? 1 : 0
              );

              LazyActionSheet?.hideActionSheet?.();

              showToast(
                `Saved ${name} to Camera Roll`,
                getAssetIDByName("toast_image_saved")
              );
            } catch {
              showToast("Couldn't save sticker");
            }
          },
          style: { marginTop: 16 }
        }),

        React.createElement(Button, {
          text: "Copy sticker URL",
          color: Button.Colors.BRAND,
          size: Button.Sizes.SMALL,
          onPress: () => {
            try {
              clipboard.setString(url);
              LazyActionSheet?.hideActionSheet?.();

              showToast(
                `Copied ${name}'s URL`,
                getAssetIDByName("ic_copy_message_link")
              );
            } catch {
              showToast("Couldn't copy sticker URL");
            }
          },
          style: { marginTop: 16 }
        })
      );
    }

    function patchSheet(method, module) {
      if (!module) return () => { };

      return after(method, module, ([args], result) => {
        const stickerNode = args?.stickerNode;

        if (!stickerNode?.src)
          return;

        const Details =
          result?.props?.children?.props?.children?.props?.children;

        if (!Details)
          return;

        const unpatchDetails = after(
          "type",
          Details,
          ([detailArgs], detailResult) => {
            const node =
              detailArgs?.stickerNode ?? stickerNode;

            if (!node?.src)
              return;

            const children =
              detailResult?.props?.children;

            if (!Array.isArray(children))
              return;

            if (
              children.some(
                child =>
                  child?.props?.children?.type?.name ===
                  "StealButtons"
              )
            )
              return;

            const index = children.findIndex(
              child => child?.type?.name === "Button"
            );

            children.splice(
              index >= 0 ? index + 1 : children.length,
              0,

              React.createElement(
                ErrorBoundary,
                null,

                React.createElement(
                  FormDivider,
                  {
                    style: {
                      marginLeft: 0,
                      marginTop: 16
                    }
                  }
                ),

                React.createElement(StealButtons, {
                  stickerNode: node
                })
              )
            );
          }
        );

        return unpatchDetails;
      });
    }

    function patchStickerActionSheet() {
      const direct = findByProps("GuildDetails");

      if (direct)
        return patchSheet("default", direct);

      const lazyPatches = [];

      const unpatchLazy = before(
        "openLazy",
        LazyActionSheet,
        ([lazySheet, name]) => {
          if (
            name !== "MessageStickerActionSheet" &&
            name !== "StickerActionSheet"
          )
            return;

          unpatchLazy();

          lazySheet
            .then(module => {
              lazyPatches.push(
                after(
                  "default",
                  module,
                  (_, result) => {
                    if (result?.type)
                      lazyPatches.push(
                        patchSheet("type", result)
                      );
                  }
                )
              );
            })
            .catch(() => { });
        }
      );

      return () => {
        unpatchLazy();

        lazyPatches.forEach(unpatch => {
          try {
            unpatch?.();
          } catch { }
        });
      };
    }

    patches.push(patchStickerActionSheet());
  },

  onUnload() {
    patches.forEach(unpatch => {
      try {
        unpatch?.();
      } catch { }
    });

    patches.length = 0;
  }
})