/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ConfirmUploadDto = {
    storageKey: string;
    type: ConfirmUploadDto.type;
    label: string;
    mime: string;
    sizeBytes: number;
    durationSec?: number;
    songId?: string;
    collectionId?: string;
};
export namespace ConfirmUploadDto {
    export enum type {
        AUDIO = 'audio',
        IMAGE = 'image',
    }
}

