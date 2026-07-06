/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CollectionResponseDto = {
    id: string;
    type: CollectionResponseDto.type;
    title: string;
    description: string | null;
    status: CollectionResponseDto.status;
    coverMediaId: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
};
export namespace CollectionResponseDto {
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

