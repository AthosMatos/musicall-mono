export const formatToCurrency = (value: number) => {
    return Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}