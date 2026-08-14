(vendetta => {
const { React } = vendetta.metro.common;
const { after, before } = vendetta.patcher;
const { findByProps } = vendetta.metro;
const { ErrorBoundary, Forms, Button } = vendetta.ui.components;
const { getAssetIDByName } = vendetta.ui.assets;
const { showToast } = vendetta.ui.toasts;
const { clipboard } = vendetta.metro.common;
const { FormDivider } = Forms;
const Lazy = findByProps("hideActionSheet");
const Media = findByProps("downloadMediaAsset");
const downloadMediaAsset = Media?.downloadMediaAsset;
let patches = [];

function StealButtons({ stickerNode }) {
  const url = stickerNode?.src;
  if (!url) return null;
  const name = stickerNode?.alt ?? stickerNode?.name ?? "sticker";
  return React.createElement(React.Fragment, null,
    React.createElement(Button,{text:"Save sticker to Camera Roll",color:Button.Colors.BRAND,size:Button.Sizes.SMALL,onPress:()=>{try{downloadMediaAsset(url,url.includes(".gif")?1:0);Lazy.hideActionSheet();showToast(`Saved ${name} to Camera Roll`,getAssetIDByName("toast_image_saved"))}catch{showToast("Couldn't save sticker")}},style:{marginTop:16}}),
    React.createElement(Button,{text:"Copy sticker URL",color:Button.Colors.BRAND,size:Button.Sizes.SMALL,onPress:()=>{clipboard.setString(url);Lazy.hideActionSheet();showToast(`Copied ${name}'s URL`,getAssetIDByName("ic_copy_message_link"))},style:{marginTop:16}})
  );
}
function patchSheet(method,module){
  if(!module) return ()=>{};
  return after(method,module,([args],res)=>{
    const stickerNode=args?.stickerNode;
    if(!stickerNode?.src)return;
    const Details=res?.props?.children?.props?.children?.props?.children;
    if(!Details)return;
    after("type",Details,([detailArgs],detailRes)=>{
      const node=detailArgs?.stickerNode??stickerNode;
      if(!node?.src)return;
      const children=detailRes?.props?.children;
      if(!Array.isArray(children))return;
      const index=children.findIndex(x=>x?.type?.name==="Button");
      children.splice(index>=0?index+1:children.length,0,
        React.createElement(ErrorBoundary,null,
          React.createElement(FormDivider,{style:{marginLeft:0,marginTop:16}}),
          React.createElement(StealButtons,{stickerNode:node})
        )
      );
    });
  });
}
function patch(){
  const direct=findByProps("GuildDetails");
  if(direct)return patchSheet("default",direct);
  const lazyPatches=[];
  const unpatchLazy=before("openLazy",Lazy,([lazySheet,name])=>{
    if(name!=="MessageStickerActionSheet")return;
    unpatchLazy();
    lazySheet.then(module=>{
      lazyPatches.push(after("default",module,(_,res)=>{
        if(res?.type)lazyPatches.push(patchSheet("type",res));
      }));
    }).catch(()=>{});
  });
  return()=>{unpatchLazy();lazyPatches.forEach(p=>p?.())};
}
return { default: {
  onLoad(){ patches.push(patch()); },
  onUnload(){ patches.forEach(p=>p?.()); patches=[]; }
}};
})