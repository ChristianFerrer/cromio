import { notFound } from "next/navigation";
import { loadChatDetail } from "@/lib/chat/queries";
import { ChatRoom } from "@/components/chat/ChatRoom";

export default async function ChatDetailPage({
  params,
}: {
  params: Promise<{ locale: string; chatId: string }>;
}) {
  const { chatId } = await params;
  const data = await loadChatDetail(chatId);

  if (!data) notFound();

  return (
    <ChatRoom
      chatId={data.chat.id}
      meId={data.me}
      other={data.other}
      initialMessages={data.messages}
      initialState={data.chat.state}
      initialMeeting={data.meeting}
      initialMyRated={data.myRated}
    />
  );
}
