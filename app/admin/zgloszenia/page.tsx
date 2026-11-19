import { DataTable, DemoNote, PageHeader } from "@/components/dashboard/widgets";
import { DemoActionButton } from "@/components/dashboard/demo-actions";
import { Badge } from "@/components/ui/badge";

const reports = [
  { id: "rep_001", target: "Opinia", detail: "„Wszystko zgodnie z umową. Polecam.” — Sebastian Górski", reason: "Podejrzenie fałszywej opinii", date: "18 listopada 2026" },
  { id: "rep_002", target: "Profil", detail: "Beata Olszewska", reason: "Prośba o weryfikację tożsamości", date: "17 listopada 2026" },
  { id: "rep_003", target: "Zlecenie", detail: "„Przycięcie żywopłotu z tui”", reason: "Nieaktualne dane kontaktowe", date: "15 listopada 2026" },
];

export default function AdminReports() {
  return (
    <>
      <PageHeader title="Zgłoszenia" description="Zgłoszenia użytkowników do moderacji." />
      <DataTable caption="Zgłoszenia" head={["Dotyczy", "Szczegóły", "Powód", "Data", ""]}>
        {reports.map((r) => (
          <tr key={r.id}>
            <td className="px-5 py-3"><Badge size="sm">{r.target}</Badge></td>
            <td className="px-5 py-3">{r.detail}</td>
            <td className="px-5 py-3">{r.reason}</td>
            <td className="whitespace-nowrap px-5 py-3 text-sm">{r.date}</td>
            <td className="px-5 py-3"><DemoActionButton label="Rozpatrz" doneLabel="Zamknięte" variant="secondary" /></td>
          </tr>
        ))}
      </DataTable>
      <DemoNote>Dane przykładowe. Docelowo zgłoszenia pochodzą z tabeli reports.</DemoNote>
    </>
  );
}
