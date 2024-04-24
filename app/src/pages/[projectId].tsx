'use client'
import React from "react";
import { Button, Cell, LoadingFlash, Row, Table } from "@bitnation-dev/components"
import { useEffect } from "react";
import { useOrganization } from "@bitnation-dev/management";
import { useModal } from "@bitnation-dev/components/dist/components/Modal/Provider";
import { Badge, BalanceCard, BreadcrumbAndHeader, SliderCardGrid } from "@bitnation-dev/management/dist/package/src/components";
import { LayoutColumn } from "@bitnation-dev/management/dist/common/ui/components/layout/layout-grid";
import { useGestiono } from '@bitnation-dev/management/dist/common/utils/hooks'
// import { useRouter } from "next/navigation"
// import { BalanceCard } from '@bitnation-dev/management/dist/common/ui/components/balance-card'
import { Amount } from '@bitnation-dev/management/dist/common/ui/components/amount'
import { useRouter } from "../components/router";
import { AddUnitModal } from "../modals/add-unit";
import { SellUnitModal } from "../modals/sell-unit";

const ProjectPage = ({
    params
}: {
    params?: {
        projectId: string
    }
}) => {
    const { divisions } = useOrganization()
    const p = divisions.data?.find(d => d.id === Number(params?.projectId || 0))
    const modal = useModal("appartment-modal")
    const router = useRouter()
    const { data, update } = useGestiono('getAppData', {
        appId: Number(process.env.GESTIONO_APP_ID),
        // @ts-ignore
        type: `unit-${params?.projectId}`,
    })
    const { data: invoices, update: updateInvoices } = useGestiono('getPendingRecords', {
        query: {
            advancedSearch: JSON.stringify([{
                field: '@projectId',
                method: '=',
                value: params?.projectId,
            }] as GestionoApi['pending-record']['GET']['Query']['advancedSearch']) as unknown as GestionoApi['pending-record']['GET']['Query']['advancedSearch'],
        }
    })

    const filteredInvoices = (u: Unit) => {
        // @ts-ignore
        return invoices?.filter((i: GestionoApi['pending-record']['GET']['Res'][number]) => {
            const clientdata = i.clientdata as {
                unitId: string
                projectId: number
            } | undefined
            return clientdata?.unitId === u.slug
        }) || []
    }

    const units: Unit[] = ((data?.map((d: any) => d.data) || []) as Unit[]).sort((a, b) => {
        if (a.slug > b.slug) return 1
        if (a.slug < b.slug) return -1
        return 0
    })

    if (!p) return <LoadingFlash loading />

    const totalValue = units?.reduce((acc, a) => acc + Number(a.totalAmount), 0) || 0
    const inInvoice = units?.reduce((acc, a) => acc + filteredInvoices(a)
        .reduce((acc: any, i: any) => acc + i.amount, 0) || 0, 0) || 0

    return <>
        <BreadcrumbAndHeader
            path={[
                ['Oficina', '/'],
                ['Proyectos', '/'],
                [p?.name || '', '/'],
            ]}
            title={<>
                {p.name}
                <p className="mb-10"><i>{p.metadata?.description || 'Sin descripcion'}</i></p>
            </>}
            actions={<>
                {(units?.length || 0) > 0 && <Button onClick={() => modal.open()} >Agregar unidades</Button>}
            </>}
        />
        <SliderCardGrid>
            <BalanceCard label="Valor total" amount={totalValue} />
            <BalanceCard label="Facturado" amount={inInvoice as number} />
            <BalanceCard label="Pago" amount={0 as number} />
            <BalanceCard label="Financiado" amount={0 as number} />
        </SliderCardGrid>
        <LayoutColumn size={1}>
            <h2 className="my-5">Unidades</h2>
            <Table
                head={['Id', 'Total', 'Para apartar', 'Inicial', 'Contra entrega', '']}
                gridTemplateColumns="250px 1fr 1fr 1fr 1fr 200px"
                Empty={<div className="w-full flex justify-center items-center flex-col h-[500px]">
                    <p>No hay unidades</p>

                    {/* @ts-ignore */}
                    <Button className="!w-fit" onClick={() => modal.open()} >Agregar unidades</Button>
                </div>}
            >
                {units?.map(a => <Row key={a.slug}>
                    <Cell className="flex items-center gap-4">
                        {a.slug}
                        {(filteredInvoices(a).length || 0) > 0 && <Badge className=" ml-2">
                            Vendido
                        </Badge>}
                    </Cell>
                    <Cell><Amount currency="DOP">{a.totalAmount}</Amount>
                        <br />
                        <span className="text-ui-success">
                            {(filteredInvoices(a).length || 0) > 0 && <>Vendido en <br /><Amount currency="DOP">{filteredInvoices(a)[0]?.amount || 0}</Amount></>}
                        </span>

                    </Cell>
                    <Cell>
                        <Amount currency="DOP">{a.totalAmount * a.percentToSetAside / 100}
                        </Amount>
                    </Cell>
                    <Cell><Amount currency="DOP">{a.totalAmount * a.percentToSettle / 100}</Amount></Cell>
                    <Cell><Amount currency="DOP">{a.totalAmount * (a.percentOnDelivery || 100 - a.percentToSettle) / 100}</Amount></Cell>
                    <Cell className=" flex flex-row-reverse gap-2">
                        {(filteredInvoices(a).length || 0) > 0 ? <Button
                            variant="tertiary"
                            className="!w-fit"
                            onClick={() => router.push('/accounting/pending-records/' + invoices?.[0].id, {
                                isOutOfApp: true
                            })} >Ver venta</Button> :
                            <SellUnitModal
                                unit={a}
                                divisionId={p.subDivisionOf as GestionoSchema['division']['id']}
                            />}
                    </Cell>
                </Row>) || []}
            </Table>
        </LayoutColumn>
        <AddUnitModal projectId={params?.projectId as string} onSubmit={() => {
            update()
            modal.close()
        }} />
    </>
}


export default ProjectPage
