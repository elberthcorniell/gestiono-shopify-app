import React from "react"
import { usePathname } from "./navigation"
import { useUrl } from "./link"
const pathBase = '/app/1'

const compareUrls = (matcher: string, pathname: string) => {
    let isValid = true
    const params: Record<string, string> = {}
    const matcherParts = matcher.split('/')
    const pathnameParts = pathname.split('/')
    if (matcherParts.length !== pathnameParts.length) {
        return [false, params]
    }
    for (let i = 0; i < matcherParts.length; i++) {
        const matcherPart = matcherParts[i]
        const pathnamePart = pathnameParts[i]
        if (matcherPart.startsWith('[') && matcherPart.endsWith(']') && pathnamePart) {
            const key = matcherPart.substring(1, matcherPart.length - 1)
            params[key] = pathnamePart
        } else if (matcherPart !== pathnamePart) {
            isValid = false
            break
        }
    }

    return [isValid, params]
}

export const Route = ({ path, children }: { path: string | null, children: React.ReactNode }) => {
    const pathname = usePathname()
    const [isValid, params] = compareUrls(path || '', pathname)

    if (isValid) {
        return React.cloneElement(children as React.ReactElement, { params })
    }

    return null
}

export const useRouter = () => {
    const url = useUrl()
    const push = (href: string, config?: {
        isOutOfApp?: boolean
    }) => {
        if (config?.isOutOfApp) {
            window.location.href = href
            return
        }
        window.history.pushState({}, '', config?.isOutOfApp ? href : url(href))
        window.dispatchEvent(new CustomEvent('popstate'))
    }
    return {
        push
    }

}