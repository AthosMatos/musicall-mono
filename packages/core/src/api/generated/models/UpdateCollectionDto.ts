/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateCollectionDto = {
    type?: UpdateCollectionDto.type;
    title?: string;
    description?: string;
    status?: UpdateCollectionDto.status;
    coverMediaId?: string | null;
};
export namespace UpdateCollectionDto {
    export enum type {
        ALBUM = 'album',
        SINGLE = 'single',
    }
    export enum status {
        DRAFT = 'draft',
        IN_PROGRESS = 'in_progress',
        RELEASED = 'released',
    }
}

