/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateCollectionDto = {
    type: CreateCollectionDto.type;
    title: string;
    description?: string;
    status?: CreateCollectionDto.status;
};
export namespace CreateCollectionDto {
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

