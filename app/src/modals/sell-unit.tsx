import { Button, ButtonModal, Cell, Grid, Input, Modal, Row, Select, Table, useModal } from "@bitnation-dev/components"
import { Gestiono, useOrganization } from "@bitnation-dev/management"
import { Amount, WidgetWrapper } from "@bitnation-dev/management/dist/package/src/components"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "../components/router"


export const SellUnitModal = ({ unit, divisionId }: {
    unit: Unit,
    divisionId: number
}) => {
    const { register, handleSubmit, getValues, formState: { errors }, setError, watch, setValue, ...form } = useForm<{
        totalAmount: number
        percentToSetAside: number
        percentToSettle: number
        percentOnDelivery: number
        divisionId: number
        beneficiaryId: number
    } & {
        root: string
    }>({
        mode: 'onBlur',
        defaultValues: {
            divisionId,
            totalAmount: unit.totalAmount,
            percentToSetAside: unit.percentToSetAside,
            percentToSettle: unit.percentToSettle,
            percentOnDelivery: unit.percentOnDelivery,
        }
    })
    const router = useRouter()
    const { beneficiaries } = useOrganization()
    const [toSetAsideTable, setToSetAsideTable] = useState<GestionoApi['credit']['POST']['Res']['table']>()
    const [toSettleTable, setToSettleTable] = useState<GestionoApi['credit']['POST']['Res']['table']>()
    const modal = useModal("sell-" + unit.slug)

    const [percentToSetAside, percentToSettle, totalAmount] =
        watch(['percentToSetAside', 'percentToSettle', 'totalAmount'])
    const percentOnDelivery = 100 - percentToSettle

    const { preSellStartDate, preSellEndDate, constructionStartDate, constructionEndDate } = unit
    const preSellDuration = getMonthsBetween(preSellStartDate, preSellEndDate)
    const durationBetweenPreSellAndConstruction = getMonthsBetween(preSellEndDate, constructionStartDate)
    const constructionDuration = getMonthsBetween(constructionStartDate, constructionEndDate)

    const toSetAsideStartDate = useMemo(() => {
        const toSetAsideStartDate = isBefore(Date.now(), preSellStartDate) ? String(preSellStartDate) : new Date().toISOString()
        return toSetAsideStartDate
    }, [preSellStartDate])

    const toSettleStartDate = useMemo(() => {
        const toSettleStartDate = isBefore(Date.now(), preSellEndDate) ? String(preSellEndDate) : new Date().toISOString()
        return toSettleStartDate
    }, [preSellEndDate])

    const paymentDate = useMemo(() => new Date().getDate(), [])

    const toSetAsideCredit: GestionoApi['credit']['POST']['Body'] = useMemo(() => ({
        amount: totalAmount * percentToSetAside / 100,
        interest: 0,
        paymentsPerYear: 12,
        totalNumberOfPayments: Math.max(preSellDuration, 0),
        latePaymentFee: 0,
        paymentDate,
        paymentsStartsOn: toSetAsideStartDate,
        pendingRecordId: 0,
        latePaymentInDays: 0,
    }), [toSetAsideStartDate, totalAmount, percentToSetAside, preSellDuration, paymentDate])
    const toSettleCredit: GestionoApi['credit']['POST']['Body'] = useMemo(() => ({
        amount: totalAmount * (percentToSettle - percentToSetAside) / 100,
        interest: 0,
        paymentsPerYear: 12,
        totalNumberOfPayments: Math.max(constructionDuration, 0) + Math.max(durationBetweenPreSellAndConstruction, 0),
        latePaymentFee: 0,
        paymentDate,
        paymentsStartsOn: toSettleStartDate,
        pendingRecordId: 0,
        latePaymentInDays: 0,
    }), [toSettleStartDate, totalAmount, percentToSettle, constructionDuration, paymentDate, percentToSetAside, durationBetweenPreSellAndConstruction])

    useEffect(() => {
        Gestiono.call<GestionoApi['credit']['POST']['Res']>('/v1/record/pending/credit/table', {
            method: 'POST',
            data: toSetAsideCredit,
        }).then(({ table }) => setToSetAsideTable(table))
    }, [toSetAsideCredit])

    useEffect(() => {
        Gestiono.call<GestionoApi['credit']['POST']['Res']>('/v1/record/pending/credit/table', {
            method: 'POST',
            data: toSettleCredit,
        })
            .then(({ table }) => setToSettleTable(table))
    }, [toSettleCredit])

    const submit = useCallback(async (data: {
        totalAmount: number
        percentToSetAside: number
        percentToSettle: number
        percentOnDelivery: number
        divisionId: number
        beneficiaryId: number
    }) => {
        let pendingRecordId: number = 0
        try {
            const { pendingRecordId }: any = await Gestiono.postPendingRecord({
                elements: [{ description: 'Apartamento ' + unit.slug, quantity: 1, unit: 'UNIT', price: Number(totalAmount), variation: 0 }],
                type: 'INVOICE',
                isSell: true,
                beneficiaryId: data.beneficiaryId,
                divisionId: data.divisionId,
                description: 'Apartamento ' + unit.slug,
                createFirstInvoice: false,
                currency: 'DOP',
                updatePrices: true,
                isInstantDelivery: true,
                clientdata: {
                    unitId: unit.slug,
                    projectId: unit.projectId,
                }
            })
            await Promise.all([
                Gestiono.addCreditPendingRecord({ ...toSetAsideCredit, pendingRecordId }),
                Gestiono.addCreditPendingRecord({ ...toSettleCredit, pendingRecordId })
            ])
            // @ts-ignore
            modal.close()
            router.push('/accounting/pending-records/' + pendingRecordId, {
                isOutOfApp: true
            })
        } catch (e: any) {
            if (pendingRecordId) {
                router.push('/accounting/pending-records/' + pendingRecordId, {
                    isOutOfApp: true
                })
                //   await Gestiono.deletePendingRecord(pendingRecordId)
            }
            setError('root', { type: 'manual', message: e.message })
        }

    }, [setError, toSetAsideCredit, toSettleCredit, unit, totalAmount, router, modal])

    return <>
        <Button fit onClick={() => {
            modal.open()
        }}>Vender</Button>
        <Modal id={"sell-" + unit.slug} minWidth={1200}>
            <h1 className="text-2xl font-bold mb-10">Vender unidad {unit.slug}</h1>
            <div className="overflow-y-auto m-[-20px] p-5 rounded-lg">
                <form onSubmit={handleSubmit(submit)}>
                    <h2>Valor</h2>
                    <Input
                        label="Valor por unidad"
                        error={getErrorMessage(errors.totalAmount)}
                        {...register('totalAmount', {
                            required: true,
                            valueAsNumber: true,
                        })}
                    />
                    <Grid columns={{ xl: 3 }} className="gap-4">
                        <Input
                            label="Porcentaje para reservar"
                            warning={`${(percentToSetAside * totalAmount / 100 || 0).toLocaleString()}`}
                            type="number"
                            error={getErrorMessage(errors.percentToSetAside)}
                            {...register('percentToSetAside', {
                                required: true,
                                min: 0,
                                max: 100,
                                valueAsNumber: true,
                            })}
                        />
                        <Input
                            label="Porcentaje de inicial"
                            warning={`${(percentToSettle * totalAmount / 100 || 0).toLocaleString()}`}
                            type="number"
                            error={getErrorMessage(errors.percentToSettle)}
                            {...register('percentToSettle', {
                                required: true,
                                min: 0,
                                max: 100,
                                valueAsNumber: true,
                            })}
                        />
                        <Input
                            label="Porcentaje contra entrega"
                            warning={`${(percentOnDelivery * totalAmount / 100 || 0).toLocaleString()}`}
                            value={percentOnDelivery}
                            type="number"
                            error={getErrorMessage(errors.percentOnDelivery)}
                        />
                    </Grid>
                    <Select label="Cliente" error={getErrorMessage(errors.beneficiaryId)} {...register('beneficiaryId', {
                        required: true,
                        valueAsNumber: true
                    })}>
                        <option disabled selected value="" />
                        {beneficiaries.data?.map(b => <option key={`beneficiariy-${b.id}`} value={b.id}>{b.name}</option>)}
                    </Select>
                    <h2 className="mt-10 mb-5">Pagos</h2>
                    <div className=" flex justify-between mt-10 mb-5">
                        <h3>Pagos para reservar</h3>
                        <div>
                            <p className=" text-sm text-right">Fechas para reservar:</p>
                            <div className=" flex gap-2">
                                <WidgetWrapper>
                                    Inicio: {new Date(preSellStartDate).toLocaleDateString('es', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </WidgetWrapper>
                                <WidgetWrapper>
                                    Fin: {new Date(preSellEndDate).toLocaleDateString('es', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </WidgetWrapper>
                            </div>
                        </div>
                    </div>
                    <Table gridTemplateColumns="250px repeat(4, minmax(0, 1fr))" head={['Fecha', 'Pago', 'Capital', 'Intereses', 'Restante']}>
                        {toSetAsideTable?.map((row, i) => <Row key={row.paymentNumber + '-to-set-aside'}>
                            <Cell>
                                Pago {row.paymentNumber} de {preSellDuration}<br />
                                <span>{new Date(row.paymentDate).toLocaleDateString('es', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}</span>
                            </Cell>
                            <Cell><Amount currency="DOP">{row.cleanCreditPayment}</Amount></Cell>
                            <Cell><Amount currency="DOP">{row.capitalPayment}</Amount></Cell>
                            <Cell><Amount currency="DOP">{row.interestPayment}</Amount></Cell>
                            <Cell><Amount currency="DOP">{row.remainer}</Amount></Cell>
                        </Row>) || []}
                    </Table>
                    <div className=" flex justify-between mt-10 mb-5">
                        <h3>Pagos para completar inicial</h3>
                        <div>
                            <p className=" text-sm text-right">Fechas de construcción:</p>
                            <div className=" flex gap-2">
                                <WidgetWrapper>
                                    Inicio: {new Date(constructionStartDate).toLocaleDateString('es', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </WidgetWrapper>
                                <WidgetWrapper>
                                    Fin: {new Date(constructionEndDate).toLocaleDateString('es', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </WidgetWrapper>
                            </div>
                        </div>
                    </div>
                    <Table gridTemplateColumns="250px repeat(4, minmax(0, 1fr))" head={['Fecha', 'Pago', 'Capital', 'Intereses', 'Restante']}>
                        {toSettleTable?.map((row, i) => <Row key={row.paymentNumber + '-to-set-aside'}>
                            <Cell>
                                Pago {row.paymentNumber} de {constructionDuration + durationBetweenPreSellAndConstruction}<br />
                                <span>{new Date(row.paymentDate).toLocaleDateString('es', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}</span>
                            </Cell>
                            <Cell><Amount currency="DOP">{row.cleanCreditPayment}</Amount></Cell>
                            <Cell><Amount currency="DOP">{row.capitalPayment}</Amount></Cell>
                            <Cell><Amount currency="DOP">{row.interestPayment}</Amount></Cell>
                            <Cell><Amount currency="DOP">{row.remainer}</Amount></Cell>
                        </Row>) || []}
                    </Table>

                    {getErrorMessage(errors.root) && <p className="bg-ui-error text-utils-white p-4 rounded-lg">
                        {getErrorMessage(errors.root)}
                    </p>}
                    <Button className="mt-10" full type="submit">Confirmar</Button>
                </form>
            </div>
        </Modal>
    </>
}

// funcion para verificar si una fecha esta antes que otra
const isBefore = (date: any, reference: any) => {
    date = new Date(date)
    reference = new Date(reference)
    return date.getTime() < reference.getTime()
}

// funcion para verificar si una fecha esta despues que otra
const isAfter = (date: any, reference: any) => {
    date = new Date(date)
    reference = new Date(reference)
    return date.getTime() > reference.getTime()
}

// funcion para verificar cuantos meses completos hay entre dos fechas
const getMonthsBetween = (date: any, reference: any) => {
    date = new Date(date)
    reference = new Date(reference)
    const months = (reference.getFullYear() - date.getFullYear()) * 12
    return months - date.getMonth() + reference.getMonth()
}

const getErrorMessage = (error: any) => {
    if (!error) return undefined
    if (error.message) return error.message
    if (error.type === 'min') return `Value is bellow min ${error.ref.name}`
    if (error.type === 'required') return 'This field is required'
    return 'Error'
}

