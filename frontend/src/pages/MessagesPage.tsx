import { useLocation } from 'react-router-dom';
import { MessagesView, type ComposeTarget } from '@/components/messages/MessagesView';
import { PageTransition } from '@/components/ui/PageTransition';

export function MessagesPage() {
  const location = useLocation();
  const compose = (location.state as { compose?: ComposeTarget } | null)?.compose;

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Messages</h1>
        <MessagesView compose={compose} />
      </div>
    </PageTransition>
  );
}
