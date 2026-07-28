import { redirect } from 'next/navigation';

export default function LegacySourcesPage(): never {
  redirect('/decks/review');
}
