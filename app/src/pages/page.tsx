'use client'
import React from "react";
import { Button, ButtonModal, Input, LoadingFlash, Select, useModal } from "@bitnation-dev/components"
import { useForm } from "react-hook-form";
import { useCallback } from "react";
import { Gestiono, useOrganization } from "@bitnation-dev/management";
import { useAlert } from "../../src/hooks/alert";
import { LayoutColumn } from "@bitnation-dev/management/components/layout/layout-grid";
import { LinkConstants } from "@bitnation-dev/management/consts/links";
import { BreadcrumbAndHeader } from "@bitnation-dev/management/components/breadcrumbs";
import { DivisionWidget } from "@bitnation-dev/management/components/widgets";
import { useGestiono } from "@bitnation-dev/management/gestiono";
import { Badge } from "@bitnation-dev/management/components/badge";
import { TrashIcon } from "@bitnation-dev/management/icons";

const appId = parseInt(process.env.GESTIONO_APP_ID || '0')
const Project = () => {
    const alert = useAlert()
    const { divisions, accounts } = useOrganization()
    const appData = useGestiono('getAppData', {
        appId,
        type: 'shopify:shop'
    }, {
        cache: true,
        swr: true
    })
    if (divisions.loading) return <p>Cargando...</p>

    return (<>
        <BreadcrumbAndHeader
            href={LinkConstants.APPS}
            title="Shopify"
            actions={<>
                <LinkShopifyStore onSubmit={() => {
                    appData.update()
                }} />
            </>}
        />
        <LayoutColumn size={1}>
            <h2 className="mb-5">Tus tiendas</h2>
        </LayoutColumn>
        <LoadingFlash loading={appData.loading} />
            {appData.data?.map((shop: any) => {
                return <LayoutColumn size={2}>
                    <div className=" outlined-card group" key={shop.id} >
                        <div>
                        <div>
                            <p>{shop.data.shop}</p>
                            <DivisionWidget id={shop.data.divisionId} />
                        </div>
                        <TrashIcon />
                    </div>
                    <h2 className="mt-5">Accesos</h2>
                    <ul className="flex flex-wrap gap-2">
                        {typeof shop.data.scope === 'string' ? shop.data.scope.split(',').map((scope: string) => {
                            return <li key={scope}><Badge variant="regular">{scope}</Badge></li>
                        }) :
                            shop.data.scope?.map((scope: string) => {
                                return <li key={scope}><Badge variant="regular">{scope}</Badge></li>
                            })}
                    </ul>
                    <h2 className="mt-5">Mapeo de cuentas</h2>
                    <p className="mb-5 mt-1 text-sm">Selecciona a que cuentas se asignarán los pagos de esta tienda</p>
                    {['DOP', 'USD', 'EUR'].map((currency) => {
                        return <div key={currency}>
                            <Select label={`Cuenta de para ${currency}`} defaultValue={shop.data.accounts?.[currency]} onChange={(e) => {
                                Gestiono.updateAppData({
                                    id: shop.id,
                                    appId,
                                    type: 'shopify:shop',
                                    strategy: 'merge',
                                    data: {
                                        accounts: {
                                            // @ts-expect-error
                                            [currency]: Number(e.target.value)
                                        }
                                    }
                                }).then(() => {
                                    alert.open({
                                        msg: `Cuenta para ${currency} actualizada`,
                                        variant: 'success'
                                    })
                                })
                            }}>
                                {accounts.data?.filter((account: any) => account.currency === currency).map((account: any) => {
                                    return <option key={account.id} value={account.id}>{account.name}</option>
                                })}
                            </Select>
                        </div>
                    })}
                </div>
            </LayoutColumn>
        })}
    </>)
}

type ShopForm = {
    shop: string,
    shopApiKey: string,
    shopApiSecretKey: string
    accessToken: string
}


const LinkShopifyStore = ({ onSubmit }: { onSubmit: () => any }) => {
    const { divisions: { update } } = useOrganization()
    const alert = useAlert()
    const { register, handleSubmit, getValues, formState: { errors }, setError, watch, setValue, ...form } = useForm<ShopForm>({
        // resolver: zodResolver(validator.postDivision.shape.body),
        mode: 'onBlur',
    })
    const modal = useModal('link-new-store')
    const shop = watch('shop')
    const submit = useCallback(async (query: ShopForm) => {
        await fetch(`${process.env.GESTIONO_API_URL}/v1/apps/shopify/auth?${new URLSearchParams(query)}`, {
            credentials: 'include'
        }).then(res => {
            if (res.ok) {
                onSubmit?.()
                update()
                modal.close()
                alert.open({
                    msg: 'Tienda validada',
                    variant: 'success'
                })
            }
            alert.open({
                msg: 'Error al validar la tienda',
                variant: 'error'
            })
        })
    }, [form, onSubmit, update, setError])
    return <ButtonModal id="link-new-store" cta="Nueva tienda">
        <h2 className="mb-4">Vincular tienda</h2>
        {errors.root?.message && <div className="p-4 rounded-lg bg-ui-error text-ui-white">{errors.root?.message}</div>}
        <form onSubmit={handleSubmit(submit)}>
            <Input {...register('shop', {
                required: 'El campo es requerido'
            })} label="Shopify store" warning={`${shop || ''}.myshopify.com`} error={errors.shop?.message} />
            <Input {...register('shopApiKey', {
                required: 'El campo es requerido'
            })} label="API key" error={errors.shopApiKey?.message} />
            <Input type="password" {...register('shopApiSecretKey', {
                required: 'El campo es requerido'
            })} label="API secret key" error={errors.shopApiSecretKey?.message} />
            <Input type="password" {...register('accessToken', {
                required: 'El campo es requerido'
            })} label="Access token" error={errors.accessToken?.message} />
            <Button type="submit">Vincular</Button>
        </form>
    </ButtonModal>
}

export default Project
// REDACTED
// REDACTED
// REDACTED