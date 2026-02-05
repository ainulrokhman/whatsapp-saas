import { listDevices } from "@/app/(admin)/actions/device-actions";
import { DevicesPageContent } from "./DevicesPageContent";

export default async function DevicesPage() {
  const result = await listDevices();
  if (!result.ok) {
    return (
      <div className="p-4">
        <p className="text-red-600 dark:text-red-400">{result.error}</p>
      </div>
    );
  }
  return <DevicesPageContent devices={result.devices} />;
}
