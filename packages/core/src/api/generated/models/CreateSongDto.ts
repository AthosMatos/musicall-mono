/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateSongDto = {
    title: string;
    status?: CreateSongDto.status;
    key?: string;
    bpm?: number;
    timeSignature?: string;
    genre?: string;
    notes?: string;
};
export namespace CreateSongDto {
    export enum status {
        DRAFT = 'draft',
        IN_PROGRESS = 'in_progress',
        FINISHED = 'finished',
    }
}

