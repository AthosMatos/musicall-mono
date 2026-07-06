/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MediaAssetResponseDto = {
    id: string;
    songId: string | null;
    collectionId: string | null;
    type: MediaAssetResponseDto.type;
    label: string;
    mime: string;
    sizeBytes: number;
    durationSec: number | null;
    createdAt: string;
};
export namespace MediaAssetResponseDto {
    export enum type {
        AUDIO = 'audio',
        IMAGE = 'image',
    }
}

