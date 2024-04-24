'use client'
import React from "react";
import { Button, Grid, Input, Modal, Select } from "@bitnation-dev/components"
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useCallback } from "react";
import { useOrganization, validator } from "@bitnation-dev/management";
import { Gestiono } from "@bitnation-dev/management";
import { useModal } from "@bitnation-dev/components/dist/components/Modal/Provider";
import Link from "../components/link";
import { useRouter } from "../components/router";
import { BreadcrumbAndHeader, Card } from "@bitnation-dev/management/dist/package/src/components";
import { LayoutColumn } from "@bitnation-dev/management/dist/common/ui/components/layout/layout-grid";

const Project = () => {
    const { divisions } = useOrganization()
    const router = useRouter()
    const modal = useModal("add-project-modal")
    if (divisions.loading) return 'Loading...'
    return (<>
        <BreadcrumbAndHeader
            path={[
                ['Oficina', '/'],
                ['Proyectos', '/'],
            ]}
            title="Proyectos"
            actions={<>
                <Button onClick={() => modal.open()}>Agregar proyecto</Button>
            </>}
        />
        {divisions.data?.filter(p => p.type === 'PROJECT')?.map(d => {
            return <LayoutColumn size={4} key={d.id + '-card'}>
                <Link href={`/${d.id}`}>
                    <Card className="cursor-pointer">
                        <h2>{d.name}</h2>
                    </Card>
                </Link>
            </LayoutColumn>
        })}
        <AddProjectModal onSubmit={projectId => {
            // @ts-ignore
            modal.close()
            router.push(`/projects/${projectId}`)
        }} />
    </>)
}


const AddProjectModal = ({ onSubmit }: { onSubmit: (projectId: GestionoSchema['division']['id']) => any }) => {
    const { divisions, beneficiaries } = useOrganization()
    const { register, handleSubmit, getValues, formState: { errors }, setError, watch, setValue, ...form } = useForm<Omit<GestionoApi['division']['POST']['Body'], 'metadata'> & {
        root: string
        metadata: {
            description: string
            beneficiaryId: number
            startDate: string
            endDate: string
        }
    }>({
        resolver: zodResolver(validator.postDivision.shape.body),
        mode: 'onBlur',
        defaultValues: {
            type: 'PROJECT',
        }
    })
    const submit = useCallback(async (data: GestionoApi['division']['POST']['Body']) => {
        try {
            const { divisionId } = await Gestiono.postDivision(data)
            divisions.update()
            form.reset()
            onSubmit && onSubmit(divisionId)
        } catch (e) {
            const handleFormError = (e: any) => [e] as any
            const handledError = handleFormError(e)
            // @ts-ignore
            handledError.map((e: any) => setError(...e as any))
            setTimeout(() => {
                setError('root', {})
            }, 5_000)
        }
    }, [form, onSubmit, divisions, setError])

    return <Modal id="add-project-modal" minWidth={600}>
        <div>
            <h2 className="mb-4">Agregar proyecto</h2>
            {errors.root?.message && <div className="p-4 rounded-lg bg-ui-error text-ui-white">{errors.root?.message}</div>}
            <form onSubmit={handleSubmit(submit)}>
                <Input
                    label="Nombre"
                    {...register('name')}
                    error={errors.name?.message as string}
                />
                <Input
                    label="Descripcion"
                    secondLabel="(Opcional)"
                    secondLabelStyle={{ color: '#DDA95C' }}
                    {...register('metadata.description')}
                    error={errors.metadata?.description?.message as string}
                />
                <Grid columns={{ xl: 2 }}>
                    <Select
                        label="Departamento"
                        error={errors.subDivisionOf?.message as string}
                        {...register('subDivisionOf', {
                            valueAsNumber: true
                        })}
                    >
                        <option disabled selected value="" />
                        {divisions.data?.map(a => <option key={`account-${a.id}`} value={a.id}>{a.name}</option>)}
                    </Select>
                    <Select
                        label="Cliente"
                        {...register('metadata.beneficiaryId', {
                            valueAsNumber: true,
                            required: 'Este campo es requerido'
                        })}
                        error={errors.metadata?.beneficiaryId?.message as string}
                    >
                        <option disabled selected value="" />
                        {beneficiaries.data?.map(a => <option key={`account-${a.id}`} value={a.id}>{a.name}</option>)}
                    </Select>
                    <Input
                        label="Fecha de inicio"
                        id="start-date"
                        type="datetime-local"
                        {...register('metadata.startDate', {
                            required: 'Este campo es requerido'
                        })}
                        error={errors.metadata?.startDate?.message as string}

                    />
                    <Input
                        label="Fecha de finalizacion"
                        id="start-date"
                        type="datetime-local"
                        {...register('metadata.endDate', {
                            required: 'Este campo es requerido'
                        })}
                        error={errors.metadata?.endDate?.message as string}
                    />
                </Grid>
                <Button type="submit" full className="!mt-10">Agregar</Button>
            </form>
        </div>
    </Modal>
}

export default Project
