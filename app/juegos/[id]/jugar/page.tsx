import { Suspense } from "react";
import { notFound } from "next/navigation";
import { GamePlayer } from "@/components/game-player";
import { LoadingScreen } from "@/components/loading-screen";
import { GAMES, getGame } from "@/lib/games";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

// params is URL data: reading it outside Suspense would tie the shared App Shell to one URL
export default function GamePlayerPage({ params }: PageProps<"/juegos/[id]/jugar">) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <GamePlayerScreen params={params} />
    </Suspense>
  );
}

async function GamePlayerScreen({ params }: Pick<PageProps<"/juegos/[id]/jugar">, "params">) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) notFound();

  return <GamePlayer game={game} />;
}
