import "@bitnation-dev/management/dist/common"

declare global {
    export type Unit = {
            projectId: string
            slug: string
            totalAmount: number,
            percentToSetAside: number
            percentToSettle: number
            percentOnDelivery: number
            preSellStartDate: number
            preSellEndDate: number
            constructionStartDate: number
            constructionEndDate: number
        }
}

export {}