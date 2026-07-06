/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SongResponseDto = {
    id: string;
    title: string;
    status: SongResponseDto.status;
    key: string | null;
    bpm: number | null;
    timeSignature: string | null;
    genre: string | null;
    notes: string | null;
    isFavorite: boolean;
    coverMediaId: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
};
export namespace SongResponseDto {
    export enum status {
        DRAFT = 'draft',
        IN_PROGRESS = 'in_progress',
        FINISHED = 'finished',
    }
}

