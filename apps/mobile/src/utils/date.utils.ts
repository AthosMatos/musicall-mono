export function formatToBrazilianDate(dateString?: string): string {
    if (!dateString) return 'n/a'
    // Parse the ISO date string (YYYY-MM-DD)
    const date = new Date(dateString);

    // Format using the Brazilian locale (pt-BR) and UTC to prevent timezone shifts
    const formatter = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'UTC',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    return formatter.format(date);
}