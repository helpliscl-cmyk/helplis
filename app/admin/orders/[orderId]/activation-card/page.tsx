import QRCode from "qrcode";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Card } from "@/components/ui/card";
import { revealPackingActivationCodes } from "@/server/operations/fulfillment";

const supportEmail = "admin@helplis.cl";
const supportPhone = "+56 9 8845 5230";
const siteUrl = "https://helplis.cl";

async function cardRows(orderId: string, actorUserId?: string) {
  const { order, rows } = await revealPackingActivationCodes(orderId, actorUserId);
  const withQr = await Promise.all(
    rows.map(async (row) => {
      const activationUrl = row.publicCode ? `${siteUrl}/activate/${row.publicCode}` : siteUrl;
      return {
        ...row,
        activationUrl,
        qrDataUrl: await QRCode.toDataURL(activationUrl, { margin: 1, width: 220 }),
      };
    }),
  );
  return { order, rows: withQr };
}

export default async function ActivationCardPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const user = await getCurrentUser();
  const { order, rows } = await cardRows(orderId, user?.id);

  return (
    <div className="grid gap-5">
      <style>{`
        @media print {
          header, .no-print { display: none !important; }
          body { background: #fff !important; }
          .print-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10mm; }
          .activation-card { box-shadow: none !important; break-inside: avoid; min-height: 86mm; }
        }
      `}</style>
      <header className="no-print">
        <Link className="text-sm text-[var(--brand-primary-dark)] underline-offset-4 hover:underline" href={`/admin/orders/${order.id}/packing`}>
          Volver a packing
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Tarjetas de activacion</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {order.orderNumber} · imprimir y cortar una tarjeta por pulsera.
        </p>
      </header>

      <div className="print-grid grid gap-4 lg:grid-cols-2">
        {rows.map((row) => (
          <Card key={row.itemId} className="activation-card grid gap-3 border-neutral-300 p-5">
            <div className="flex items-start justify-between gap-3">
              <BrandLogo className="h-9" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={row.qrDataUrl} alt="QR activacion" className="h-24 w-24" />
            </div>
            <div>
              <p className="text-xs uppercase text-neutral-500">Codigo de la pulsera</p>
              <p className="font-mono text-xl font-semibold">{row.publicCode ?? "Sin asignar"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-neutral-500">Codigo secreto de activacion</p>
              <p className="font-mono text-xl font-semibold">{row.activationCode ?? "No disponible"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-neutral-500">URL de activacion</p>
              <p className="break-all text-sm">{row.activationUrl}</p>
            </div>
            <ol className="grid list-decimal gap-1 pl-5 text-sm text-neutral-700">
              <li>Entra a helplis.cl.</li>
              <li>Selecciona Activar.</li>
              <li>Ingresa el codigo publico.</li>
              <li>Ingresa el codigo secreto.</li>
              <li>Crea o inicia sesion.</li>
              <li>Configura el perfil.</li>
            </ol>
            <div className="border-t border-neutral-200 pt-3 text-xs text-neutral-600">
              <p>Soporte: {supportEmail}</p>
              <p>{supportPhone} · {siteUrl}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
