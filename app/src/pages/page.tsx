'use client'
import React from "react";
import { Button, ButtonModal, Grid, Input, Modal, Select } from "@bitnation-dev/components"
import { useForm } from "react-hook-form";
import { useCallback } from "react";
import { useOrganization, validator } from "@bitnation-dev/management";
import { BreadcrumbAndHeader, Card, DivisionWidget } from "@bitnation-dev/management/dist/package/src/components";
import { LayoutColumn } from "@bitnation-dev/management/dist/common/ui/components/layout/layout-grid";
import { useGestiono } from "@bitnation-dev/management/dist/common/utils/hooks";

const Project = () => {
    const { divisions } = useOrganization()
    const appData = useGestiono('getAppData', {
        appId: parseInt(process.env.GESTIONO_APP_ID || '0'),
        // @ts-ignore
        type: 'shopify:shop'
    })
    if (divisions.loading) return 'Loading...'
    return (<>
        <BreadcrumbAndHeader
            path={[
                ['Oficina', '/'],
                ['Shopify', '/'],
            ]}
            title="Shopify"
            actions={<>
                <LinkShopifyStore onSubmit={() => {}} />
            </>}
        />
        <LayoutColumn size={2}>
            <h2>Tus tiendas</h2>
            {appData.data?.map((shop: any) => {
                return <Card key={shop.id} >
                    <p>{shop.data.shop}</p>
                    <DivisionWidget id={shop.data.divisionId} />
                    <p><strong>Accesos:</strong></p>
                    <ul>
                        {typeof shop.data.scope === 'string' ? <li><p>{shop.data.scope}</p></li> :
                        shop.data.scope.map((scope: string) => {
                            return <li key={scope}><p>{scope}</p></li>
                        })}
                    </ul>

                    <Grid columns={{ xl: 2 }}>
                        <Button full>Sincronizar</Button>
                        <Button full>Desvincular</Button>
                    </Grid>
                </Card>
            })}
        </LayoutColumn>
    </>)
}

type ShopForm = {
    shop: string
}


const LinkShopifyStore = ({ onSubmit }: { onSubmit: (projectId: GestionoSchema['division']['id']) => any }) => {
    const { divisions } = useOrganization()
    const { register, handleSubmit, getValues, formState: { errors }, setError, watch, setValue, ...form } = useForm<ShopForm>({
        // resolver: zodResolver(validator.postDivision.shape.body),
        mode: 'onBlur',
    })
    const shop = watch('shop')
    const submit = useCallback(async (query: ShopForm) => {
        
    }, [form, onSubmit, divisions, setError])
    const validationUrl = `${process.env.GESTIONO_API_URL}/v1/apps/shopify/auth?shop=${encodeURI(shop)}`
    return <ButtonModal id="link-new-store" cta="Nueva tienda">
            <h2 className="mb-4">Vincular tienda</h2>
            {errors.root?.message && <div className="p-4 rounded-lg bg-ui-error text-ui-white">{errors.root?.message}</div>}
            <form onSubmit={handleSubmit(submit)}>
                <Input {...register('shop')} label="Shopify store" warning={`${shop}.myshopify.com`} />
                <a target="_blank" onClick={(e) => {
                    window.location.href = validationUrl
                }} href={validationUrl}>
                    <Button type="submit">Vincular</Button>
                </a>
            </form>
        </ButtonModal>
}

export default Project
