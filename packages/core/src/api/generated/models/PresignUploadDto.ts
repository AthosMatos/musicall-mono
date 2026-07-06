/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PresignUploadDto = {
    type: PresignUploadDto.type;
    mime: string;
    sizeBytes: number;
    songId?: string;
    collectionId?: string;
};
export namespace PresignUploadDto {
    export enum type {
        AUDIO = 'audio',
        IMAGE = 'image',
    }
}

