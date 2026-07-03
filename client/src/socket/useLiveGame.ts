import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { getSocket } from './socket';

/**
 * Open the socket connection and forward server events into the store.
 * Mount this once on any live page (lobby / play / results).
 */
export function useLiveGame(): void {
  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const store = useGameStore.getState;

    socket.on('lobby:playersUpdate', ({ players }) => store().setPlayers(players));
    socket.on('game:started', (data) => store().applyStarted(data));
    socket.on('submissions:progress', (progress) => store().setProgress(progress));
    socket.on('game:finished', ({ results }) => store().applyFinished(results));
    socket.on('game:personalResults', (results) => store().setPersonalResults(results));
    socket.on('error', ({ message }) => store().setError(message));

    return () => {
      socket.off('lobby:playersUpdate');
      socket.off('game:started');
      socket.off('submissions:progress');
      socket.off('game:finished');
      socket.off('game:personalResults');
      socket.off('error');
    };
  }, []);
}
