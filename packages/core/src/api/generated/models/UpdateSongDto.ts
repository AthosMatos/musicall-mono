/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateSongDto = {
    title?: string;
    status?: UpdateSongDto.status;
    key?: string;
    bpm?: number;
    timeSignature?: string;
    genre?: string;
    notes?: string;
    isFavorite?: boolean;
    coverMediaId?: string | null;
};
export namespace UpdateSongDto {
    export enum status {
        DRAFT = 'draft',
        IN_PROGRESS = 'in_progress',
        FINISHED = 'finished',
    }
}

