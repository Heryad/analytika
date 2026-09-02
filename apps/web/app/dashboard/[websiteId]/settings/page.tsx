import { getServerWebsite } from "@/lib/server-auth";
import { WebsiteSettingsClient } from "./settings-client";

interface PageProps {
  params: Promise<{ websiteId: string }>;
}

export default async function WebsiteSettingsPage({ params }: PageProps) {
  const { websiteId } = await params;
  const serverData = await getServerWebsite(websiteId);

  return (
    <WebsiteSettingsClient
      websiteId={websiteId}
      initialWebsite={serverData?.website || null}
      initialSnippets={serverData?.snippets || null}
    />
  );
}
