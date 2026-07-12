import { ProductType, ProductionMode } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { createProductionBatchAction, createSampleProductionBatchAction } from "@/features/production/actions";

export default function NewProductionBatchPage() {
  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Nuevo lote de produccion</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Crea el lote digital antes de fabricar pulseras. El lote real de 500 no se crea automaticamente.
        </p>
      </header>

      <Card className="border-amber-200 bg-amber-50">
        <p className="text-sm font-medium text-amber-900">
          Los codigos creados para produccion no deben eliminarse ni reutilizarse despues de enviarse al proveedor.
        </p>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Create sample batch</h2>
        <form action={createSampleProductionBatchAction} className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field label="Cantidad demo">
            <Select name="quantity" defaultValue="5">
              {[1, 3, 5, 10].map((quantity) => (
                <option key={quantity} value={quantity}>
                  {quantity}
                </option>
              ))}
            </Select>
          </Field>
          <input type="hidden" name="internalReference" value="SAMPLE-DEMO-001" />
          <Button type="submit" variant="secondary">
            Crear SAMPLE-DEMO-001
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Datos del lote</h2>
        <form action={createProductionBatchAction} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Referencia interna">
              <Input name="internalReference" placeholder="Ej: SAMPLE-DEMO-001" />
            </Field>
            <Field label="Modo">
              <Select name="productionMode" defaultValue={ProductionMode.DEMO}>
                {Object.values(ProductionMode).map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Proveedor">
              <Input name="supplierName" required defaultValue="Proveedor por definir" />
            </Field>
            <Field label="Contacto proveedor">
              <Input name="supplierContact" />
            </Field>
            <Field label="Referencia cotizacion">
              <Input name="supplierQuoteReference" />
            </Field>
            <Field label="Modelo">
              <Input name="productModel" placeholder="Pulsera silicona ajustable" />
            </Field>
            <Field label="Tipo producto">
              <Select name="productType" defaultValue={ProductType.WRISTBAND}>
                {Object.values(ProductType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Cantidad">
              <Input name="quantity" type="number" min={1} max={500} required defaultValue={5} />
            </Field>
            <Field label="Color">
              <Input name="color" placeholder="Celeste" />
            </Field>
            <Field label="Chip NFC">
              <Input name="chipType" placeholder="NTAG213" />
            </Field>
            <Field label="Dominio publico">
              <Input name="domain" defaultValue="https://helplis.cl" />
            </Field>
          </div>
          <Field label="Notas operativas">
            <Textarea name="notes" placeholder="Aclaraciones de muestra, proveedor, material, embalaje o control." />
          </Field>
          <Button type="submit">Crear lote</Button>
        </form>
      </Card>
    </div>
  );
}
