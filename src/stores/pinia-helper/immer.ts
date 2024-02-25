import { enablePatches, enableMapSet, Immer } from 'immer';
// immerの内部関数であるgetPlugin("Patches").applyPatches_はexportされていないので
// ビルド前のsrcからソースコードを読み込んで使う必要がある
import { enablePatches as enablePatchesImpl } from 'immer/src/plugins/patches';
import { enableMapSet as enableMapSetImpl } from 'immer/src/plugins/mapset';
import { getPlugin } from 'immer/src/utils/plugins';

// ビルド後のモジュールとビルド前のモジュールは別のスコープで変数を持っているので
// enable * も両方叩く必要がある。
enablePatches();
enableMapSet();
enablePatchesImpl();
enableMapSetImpl();
// immerのPatchをmutableに適応する内部関数
export const applyPatchesImpl = getPlugin('Patches').applyPatches_;

export const immer = new Immer();
immer.setAutoFreeze(false);
