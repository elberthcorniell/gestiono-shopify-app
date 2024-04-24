import React, { useCallback } from "react"
import { Button, Grid, Input, Modal } from "@bitnation-dev/components"
import { getErrorMessage } from "@bitnation-dev/management/dist/package/src/utils/other"
import { Gestiono } from "@bitnation-dev/management"
import { useForm } from "react-hook-form"
import { Amount } from "@bitnation-dev/management/dist/package/src/components"

export const AddUnitModal = ({ projectId, onSubmit }: { projectId: string, onSubmit?: () => any }) => {
    const { register, handleSubmit, getValues, formState: { errors }, setError, watch, setValue, ...form } = useForm<Unit & {
        root: string,
        slugPrefix: string,
        noOfApartments: number,
    }>({
        mode: 'onBlur',
        defaultValues: {
            projectId,
            noOfApartments: 1,
        }
    })
    const [slugPrefix, noOfApartments, percentToSetAside, percentToSettle, totalAmount] =
        watch(['slugPrefix', 'noOfApartments', 'percentToSetAside', 'percentToSettle', 'totalAmount'])
    const percentOnDelivery = 100 - percentToSettle

    const submit = useCallback(async ({ slugPrefix, noOfApartments, ...data }: Unit & {
        slugPrefix: string,
        noOfApartments: number,
    }) => {
        const calls = []
        for (let i = 0; i < noOfApartments; i++) {
            const slug = slugPrefix + '-' + (i + 101)
            calls.push(Gestiono.insertAppData({
                appId: Number(process.env.GESTIONO_APP_ID),
                type: `unit-${projectId}`,
                data: {
                    ...data,
                    percentOnDelivery: 100 - data.percentToSettle,
                    slug,
                }
            }))
        }
        await Promise.all(calls)
            .then(() => {
                form.reset()
                onSubmit && onSubmit()
            }).catch(e => {
                setError('root', { type: 'manual', message: e.message })
            })
    }, [form, onSubmit, setError, percentOnDelivery])

    return <Modal id="appartment-modal" minWidth={700}>
        <h1 className="text-2xl font-bold mb-10">Agregar unidad</h1>
        <div className="overflow-y-auto m-[-20px] p-5 rounded-lg">
            <form onSubmit={handleSubmit(submit)}>
                <h2>Nomenclatura</h2>
                <Grid columns={{ xl: 2 }} className="gap-4">
                    <Input
                        label="Prefijo"
                        secondLabel='Por ejemplo "M" en "M-101"'
                        error={getErrorMessage(errors.slugPrefix)}
                        {...register('slugPrefix', { required: true })}
                    />
                    <Input
                        label="Numero de unidades"
                        type="number"
                        error={getErrorMessage(errors.noOfApartments)}
                        {...register('noOfApartments', { required: true, valueAsNumber: true })}
                    />
                </Grid>
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
                <h2>Fechas</h2>
                <Grid columns={{ xl: 2 }} className="gap-4">
                    <Input
                        label="Fecha de inicio de preventa"
                        type="date"
                        error={getErrorMessage(errors.preSellStartDate)}
                        {...register('preSellStartDate', { required: true, valueAsDate: true })}
                    />
                    <Input
                        label="Fecha de fin de preventa"
                        type="date"
                        error={getErrorMessage(errors.preSellEndDate)}
                        {...register('preSellEndDate', { required: true, valueAsDate: true })}
                    />
                    <Input
                        label="Fecha de inicio de construccion"
                        type="date"
                        error={getErrorMessage(errors.constructionStartDate)}
                        {...register('constructionStartDate', { required: true, valueAsDate: true })}
                    />
                    <Input
                        label="Fecha de entrega"
                        type="date"
                        error={getErrorMessage(errors.constructionEndDate)}
                        {...register('constructionEndDate', { required: true, valueAsDate: true })}
                    />
                </Grid>
                <h2 className="my-5">Resumen</h2>
                <p className="bg-ui-input dark:bg-brand-dark-400 p-4 rounded-lg mb-10">
                    Crear unidades del {slugPrefix}-101 al {slugPrefix}-{noOfApartments + 100} por un valor de <Amount currency="DOP">{totalAmount}</Amount> cada uno
                </p>
                {getErrorMessage(errors.root) && <p className="bg-ui-error text-utils-white p-4 rounded-lg">
                    {getErrorMessage(errors.root)}
                </p>}

                <Button className="mt-10" full type="submit">Agregar</Button>
            </form>
        </div>
    </Modal>
}
