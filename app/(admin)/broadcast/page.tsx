import { listBroadcastLogs } from "@/app/(admin)/actions/broadcast-actions";
import { listDevices } from "@/app/(admin)/actions/device-actions";
import { listContacts } from "@/app/(admin)/actions/contact-actions";
import { BroadcastPageContent } from "./BroadcastPageContent";

export default async function BroadcastPage() {
  const [logsResult, devicesResult, contactsResult] = await Promise.all([
    listBroadcastLogs(),
    listDevices(),
    listContacts(),
  ]);
  if (!logsResult.ok) {
    return (
      <div className="p-4">
        <p className="text-red-600 dark:text-red-400">{logsResult.error}</p>
      </div>
    );
  }
  const devices = devicesResult.ok ? devicesResult.devices : [];
  const contacts = contactsResult.ok ? contactsResult.contacts : [];
  return (
    <BroadcastPageContent
      initialLogs={logsResult.logs}
      devices={devices}
      contacts={contacts}
    />
  );
}
