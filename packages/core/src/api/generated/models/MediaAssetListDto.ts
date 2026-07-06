/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MediaAssetListDto = Array<{
    id: string;
    songId: string | null;
    collectionId: string | null;
    type: 'audio' | 'image';
    label: string;
    mime: string;
    sizeBytes: number;
    durationSec: number | null;
    createdAt: string;
}>;
