
import type { Metadata } from 'next';
import { ChatbotClientPage } from '@/components/chatbot/chatbot-client-page';

export const metadata: Metadata = {
  title: 'Assistant', // Will be "LURH - Assistant"
  description: 'Chat with the AI assistant for help with the Landmark University Resource Hub.',
};

export default function ChatbotPage() {
  return <ChatbotClientPage />;
}
