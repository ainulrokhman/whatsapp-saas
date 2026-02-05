import { listContacts } from "@/app/(admin)/actions/contact-actions";
import { ContactsPageContent } from "./ContactsPageContent";

export default async function ContactsPage() {
  const result = await listContacts();
  if (!result.ok) {
    return (
      <div className="p-4">
        <p className="text-red-600 dark:text-red-400">{result.error}</p>
      </div>
    );
  }
  return <ContactsPageContent contacts={result.contacts} />;
}
